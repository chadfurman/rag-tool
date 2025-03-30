import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const find = createTool({
  id: "Find Files",
  description: "Search for files by name pattern in a directory",
  inputSchema: z.object({
    pattern: z.string().describe("The file name pattern to search for"),
    directory: z.string().optional().describe("Directory to search in (default: current directory)"),
    recursive: z.boolean().optional().describe("Search subdirectories recursively")
  }),
  execute: async ({ context: { pattern, directory = ".", recursive = false } }) => {
    try {
      const command = `find ${directory} ${recursive ? "" : "-maxdepth 1"} -name "${pattern}"`;
      const { stdout } = await execAsync(command);
      
      return stdout
        .split("\n")
        .filter(file => file.trim())
        .map(file => path.resolve(file));
    } catch (error) {
      throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
