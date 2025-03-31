import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readdir } from "fs/promises";
import path from "path";

export const ls = createTool({
  id: "List Files",
  description: "List files and directories in a specified path. Use to explore directory contents before performing operations.",
  inputSchema: z.object({
    path: z.string().optional().describe("Directory path to list. Example: './', 'src/tools', '/usr/local/bin'. Default: './'"),
    all: z.boolean().optional().describe("Include hidden files (those starting with '.'). Example: true. Default: false"),
  }),
  outputSchema: z.array(z.object({
      name: z.string(),
      path: z.string(),
      type: z.string()
    })),
  execute: async (args) => {
    // Safely extract parameters with defaults
    const { context = {} } = args;
    const dirPath = context.path || "."; 
    const all = context.all || false;

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

        results.push(result);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
