import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";

export const cat = createTool({
  id: "Read File",
  description: "Output the complete contents of a file. REQUIRES 'file' parameter with the path.",
  inputSchema: z.object({
    file: z.string().describe("REQUIRED: Path to the file to read. Example: 'src/index.ts', '/etc/hosts', './package.json'")
  }),
  execute: async (args) => {
    // Safely extract parameters
    const { context = {} } = args;
    const file = context.file;
    
    // If required parameter is missing, throw a clear error
    if (!file) {
      throw new Error('Missing required parameter: file');
    }
    try {
      const absolutePath = path.resolve(file);
      const content = await readFile(absolutePath, 'utf8');
      return {
        path: absolutePath,
        content
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
