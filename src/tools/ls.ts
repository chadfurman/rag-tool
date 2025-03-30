import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readdir } from "fs/promises";
import path from "path";

export const ls = createTool({
  id: "List Files",
  description: "List directory contents",
  inputSchema: z.object({
    path: z.string().optional().describe("Directory path (default: current directory)"),
    all: z.boolean().optional().describe("Include hidden files"),
    long: z.boolean().optional().describe("Use long listing format")
  }),
  execute: async ({ context: { path = ".", all = false, long = false } }) => {
    try {
      const files = await readdir(path, { 
        withFileTypes: true,
        encoding: 'utf8'
      });

      return files
        .filter(file => all || !file.name.startsWith('.'))
        .map(file => ({
          name: file.name,
          path: path.resolve(path, file.name),
          type: file.isDirectory() ? 'directory' : 'file',
          ...(long && {
            size: file.isFile() ? file.size : undefined,
            modified: file.mtime
          })
        }));
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
