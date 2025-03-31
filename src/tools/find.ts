import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Maximum buffer size (8MB)
const MAX_BUFFER_SIZE = 8 * 1024 * 1024;

// Maximum files to return in one result
const DEFAULT_PAGE_SIZE = 100;

/**
 * Recursive find implementation that handles large directories
 * Uses a combination of directory traversal and glob matching for better performance
 * and to avoid buffer overflow issues
 */
async function findFiles(options: {
  pattern: string;
  directory: string;
  recursive: boolean;
  maxDepth?: number;
  pageSize?: number;
  pageToken?: string;
}): Promise<{
  files: string[];
  nextPageToken?: string;
  totalFound: number;
}> {
  const { 
    pattern, 
    directory = ".", 
    recursive = false,
    maxDepth = recursive ? 255 : 1,
    pageSize = DEFAULT_PAGE_SIZE,
    pageToken
  } = options;

  // Use safer command with max buffer size and result limitation
  const command = `find "${directory}" -maxdepth ${maxDepth} -name "${pattern}" -type f | head -n ${pageSize + 1}`;
  
  try {
    // Execute find command with increased buffer size
    const { stdout } = await execAsync(command, { maxBuffer: MAX_BUFFER_SIZE });
    const allFiles = stdout
      .split("\n")
      .filter(file => file.trim())
      .map(file => path.resolve(file));
    
    const totalFound = allFiles.length;
    
    // If we have more than pageSize, we need to paginate
    const hasMore = allFiles.length > pageSize;
    const files = hasMore ? allFiles.slice(0, pageSize) : allFiles;
    
    // Create a page token if we have more results
    let nextPageToken: string | undefined;
    if (hasMore) {
      const lastFile = files[files.length - 1];
      nextPageToken = Buffer.from(lastFile).toString('base64url');
    }
    
    return {
      files,
      nextPageToken,
      totalFound
    };
  } catch (error) {
    // Fall back to manual directory traversal for large directories or on error
    if (error instanceof Error && error.message.includes('maxBuffer')) {
      return manualDirectoryTraversal({
        pattern,
        directory,
        recursive,
        maxDepth,
        pageSize,
        pageToken
      });
    }
    throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Manual directory traversal as a fallback for large directories
 * Uses native fs functions to avoid buffer limitations
 */
async function manualDirectoryTraversal(options: {
  pattern: string;
  directory: string;
  recursive: boolean;
  maxDepth: number;
  pageSize: number;
  pageToken?: string;
}): Promise<{
  files: string[];
  nextPageToken?: string;
  totalFound: number;
}> {
  const { pattern, directory, recursive, pageSize, pageToken } = options;
  
  // Convert glob pattern to regex
  const regexPattern = new RegExp(
    "^" + pattern.split("*").map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(".*") + "$"
  );
  
  let startAfter: string | undefined;
  if (pageToken) {
    try {
      startAfter = Buffer.from(pageToken, 'base64url').toString();
    } catch (e) {
      // Invalid token, ignore
    }
  }
  
  let files: string[] = [];
  let foundStartPoint = !startAfter;
  let totalFound = 0;
  
  try {
    // Get all entries in the directory
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // Skip until we find the starting point from last page
      if (!foundStartPoint && startAfter) {
        if (fullPath === startAfter) {
          foundStartPoint = true;
        }
        continue;
      }
      
      if (entry.isFile() && regexPattern.test(entry.name)) {
        totalFound++;
        if (files.length < pageSize) {
          files.push(fullPath);
        }
      }
      
      // Recursively process subdirectories if needed
      if (entry.isDirectory() && recursive) {
        try {
          const subResults = await manualDirectoryTraversal({
            pattern,
            directory: fullPath,
            recursive,
            maxDepth: options.maxDepth - 1,
            pageSize: pageSize - files.length,
            pageToken: undefined // Don't use page token for subdirectories
          });
          
          totalFound += subResults.totalFound;
          files = [...files, ...subResults.files];
          
          // Stop if we have enough files
          if (files.length >= pageSize) {
            break;
          }
        } catch (error) {
          // Skip directories we can't access
          console.warn(`Skipping directory ${fullPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Stop if we have enough files
      if (files.length >= pageSize) {
        break;
      }
    }
    
    // Create a page token if we have more files than requested
    let nextPageToken: string | undefined;
    if (totalFound > files.length) {
      const lastFile = files[files.length - 1];
      nextPageToken = Buffer.from(lastFile).toString('base64url');
    }
    
    return {
      files,
      nextPageToken,
      totalFound
    };
  } catch (error) {
    throw new Error(`Failed to traverse directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const find = createTool({
  id: "Find Files",
  description: "Search for files by name pattern in a directory",
  inputSchema: z.object({
    pattern: z.string().describe("The file name pattern to search for"),
    directory: z.string().optional().describe("Directory to search in (default: current directory)"),
    recursive: z.boolean().optional().describe("Search subdirectories recursively"),
    pageSize: z.number().optional().describe("Maximum number of files to return (default: 100)"),
    pageToken: z.string().optional().describe("Token for pagination"),
    maxDepth: z.number().optional().describe("Maximum directory depth to search")
  }),
  execute: async ({ 
    context: { 
      pattern, 
      directory = ".", 
      recursive = false,
      pageSize = DEFAULT_PAGE_SIZE,
      pageToken,
      maxDepth = recursive ? 255 : 1
    } 
  }) => {
    try {
      return await findFiles({
        pattern,
        directory,
        recursive,
        maxDepth,
        pageSize,
        pageToken
      });
    } catch (error) {
      throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});