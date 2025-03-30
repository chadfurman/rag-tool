import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readdir, stat } from "fs/promises";
import path from "path";

export const ls = createTool({
  id: "List Files",
  description: "List directory contents",
  inputSchema: z.object({
    path: z.string().optional().describe("Directory path (default: current directory)"),
    all: z.boolean().optional().describe("Include hidden files"),
    long: z.boolean().optional().describe("Use long listing format")
  }),
  execute: async ({ context: { path: dirPath = ".", all = false, long = false } }) => {
    try {
      const files = await readdir(dirPath, { 
        withFileTypes: true,
        encoding: 'utf8'
      });

      const results = [];
      for (const file of files) {
        if (!all && file.name.startsWith('.')) continue;
        
        const fullPath = path.join(dirPath, file.name);
        const result: any = {
          name: file.name,
          path: fullPath,
          type: file.isDirectory() ? 'directory' : 'file'
        };

        if (long) {
          try {
            const stats = await stat(fullPath);
            result.size = stats.size;
            result.modified = stats.mtime;
          } catch {
            // Ignore stat errors
          }
        }

        results.push(result);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
