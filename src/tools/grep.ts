import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import logger from "@/utils/logger.js";

const execAsync = promisify(exec);

export const grep = createTool({
  id: "Recursive Grep",
  description: "Search file contents for matching patterns.  Can search through multiple files and folders at once.  Recursive grep with +/- 2 lines of context",
  inputSchema: z.object({
    pattern: z.string().describe("REQUIRED: The regex pattern to search for. Example: 'function', 'class\\s+User', 'error.*log'"),
    file: z.string().optional().describe("File path to search in. Example: 'src/index.ts', '/path/to/file.js'"),
    ignoreCase: z.boolean().optional().describe("Case insensitive search. Example: true. Default: false"),
    lineNumbers: z.boolean().optional().describe("Include line numbers in output. Example: true. Default: true")
  }),
  execute: async (args) => {
    // Safely extract parameters with defaults
    const { context = {} } = args;
    const pattern = context.pattern;
    const file = context.file;
    
    // If required parameters are missing, throw a clear error
    if (!pattern) {
      throw new Error('Missing required parameter: pattern');
    }

    logger.debug("Executing grep tool with parameters: ", {
      pattern,
      file: file || "./",
      ignoreCase: context.ignoreCase,
      lineNumbers: context.lineNumbers
    });

    const ignoreCase = context.ignoreCase || false;
    const lineNumbers = context.lineNumbers !== false; // Default to true
    try {
      const flags = [
        ignoreCase ? '-i' : '',
        lineNumbers ? '-n' : '',
        '-C 2',
        '-r' // always enable recursive grep
      ].filter(Boolean).join(' ');

      const excludedDirs = ['node_modules', 'dist', 'build', '.git']; // Common directories to exclude
      const excludeFlags = excludedDirs.map(dir => `--exclude-dir=${dir}`).join(' ');

      const command = `grep ${flags} ${excludeFlags} "${pattern}" ${file ?? './'}`;
      const { stdout } = await execAsync(command);

      // For recursive grep without a specific file, parse the file path from the output
      const results = stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          // When doing recursive grep, the format is "filename:line_number:content"
          // For single file grep, the format is "line_number:content"
          const parts = line.split(':');
          
          if (!file) {
            // For recursive grep (no specific file provided)
            // Format: "filename:line_number:content"
            const foundFile = parts[0];
            const lineNum = parts[1];
            const content = parts.slice(2).join(':').trim();
            
            return {
              file: foundFile,
              lineNumber: lineNumbers ? parseInt(lineNum) : undefined,
              content: content
            };
          } else {
            // For single file grep
            // Format: "line_number:content"
            const lineNum = parts[0];
            const content = parts.slice(1).join(':').trim();
            
            return {
              file: path.resolve(file),
              lineNumber: lineNumbers ? parseInt(lineNum) : undefined,
              content: content
            };
          }
        });
      
      logger.debug(`Grep found ${results.length} matches`);
      return results;
    } catch (error) {
      // grep returns non-zero exit code when no matches found
      if (error instanceof Error && 'code' in error && error.code === 1) {
        logger.debug("Grep found no matches");
        return [];
      }
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Grep failed: ${errorMsg}`, {
        pattern,
        file: file || "./",
        error
      });
      
      throw new Error(`Failed to grep ${file ? `file: ${file}` : 'files'}: ${errorMsg}`);
    }
  }
});
