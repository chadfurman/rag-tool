import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";

export const cat = createTool({
  id: "Read File",
  description: "Output the complete contents of a file",
  inputSchema: z.object({
    file: z.string().describe("Path to the file to read")
  }),
  execute: async ({ context: { file } }) => {
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
