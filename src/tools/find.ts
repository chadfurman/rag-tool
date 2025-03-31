import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import logger from "@/utils/logger.js";

const execAsync = promisify(exec);

// Maximum buffer size (8MB)
const MAX_BUFFER_SIZE = 8 * 1024 * 1024;

/**
 * Recursive find implementation that handles large directories
 * Uses a combination of directory traversal and glob matching for better performance
 * and to avoid buffer overflow issues
 */
async function findFiles(options: {
  pattern: string;
  directory: string;
}): Promise<{
  files: string[];
}> {
  const { 
    pattern, 
    directory = ".", 
  } = options;

  // Use safer command with max buffer size and result limitation
  const command = `find "${directory}" -maxdepth 100 -name "${pattern}" -type f`;
  
  try {
    // Execute find command with increased buffer size
    const { stdout } = await execAsync(command, { maxBuffer: MAX_BUFFER_SIZE });
    const allFiles = stdout
      .split("\n")
      .filter(file => file.trim())
      .map(file => path.resolve(file));

    return {
      files: allFiles,
    };
  } catch (error) {
    throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const find = createTool({
    id: "findFiles",
    description: "Search for files by name pattern in a directory.",
    inputSchema: z.object({
      pattern: z.string().describe("The file name pattern to search for. Examples: '*.ts', '*.js', 'config.*', '*.{json,yaml}'"),
      directory: z.string().optional().describe("Directory to search in. Example: 'src/tools' or '/absolute/path'. Default: current directory"),
    }),
    outputSchema: z.object({
      files: z.array(z.string()).describe("List of matching files")
    }),
  execute: async (args) => {
    logger.debug("Executing findFiles tool with parameters: ", args.context);
    // Safely extract parameters with defaults
    const { context } = args;
    const pattern = context.pattern; // Required parameter

    // If pattern is missing, throw a clear error
    if (!pattern) {
      throw new Error('Missing required parameter: pattern');
    }

    const directory = context.directory || ".";

    try {
      return await findFiles({
        pattern,
        directory,
      });
    } catch (error) {
      throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});