import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const grep = createTool({
  id: "Grep Files",
  description: "Search file contents for matching patterns",
  inputSchema: z.object({
    pattern: z.string().describe("The regex pattern to search for"),
    file: z.string().describe("File path to search in"),
    ignoreCase: z.boolean().optional().describe("Case insensitive search"),
    lineNumbers: z.boolean().optional().describe("Include line numbers in output")
  }),
  execute: async ({ context: { pattern, file, ignoreCase = false, lineNumbers = true } }) => {
    try {
      const flags = [
        ignoreCase ? '-i' : '',
        lineNumbers ? '-n' : ''
      ].filter(Boolean).join(' ');
      
      const command = `grep ${flags} "${pattern}" "${file}"`;
      const { stdout } = await execAsync(command);

      return stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [lineNum, ...content] = line.split(':');
          return {
            file: path.resolve(file),
            lineNumber: lineNumbers ? parseInt(lineNum) : undefined,
            content: content.join(':').trim()
          };
        });
    } catch (error) {
      // grep returns non-zero exit code when no matches found
      if (error instanceof Error && 'code' in error && error.code === 1) {
        return [];
      }
      throw new Error(`Failed to grep file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
