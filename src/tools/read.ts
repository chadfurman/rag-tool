import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";

const parseRange = (range?: string) => {
  if (!range) return undefined;
  const [start, end] = range.split(':').map(Number);
  return { start, end: end || start };
};

export const read = createTool({
  id: "Read File Range",
  description: "Read specific portions of a file with line/character ranges",
  inputSchema: z.object({
    file: z.string().describe("Path to the file to read"),
    lineRange: z.string().optional().describe("Line range in format 'start:end' or single line"),
    charRange: z.string().optional().describe("Character range in format 'start:end' or single offset")
  }),
  execute: async ({ context: { file, lineRange, charRange } }) => {
    try {
      const absolutePath = path.resolve(file);
      const content = await readFile(absolutePath, 'utf8');
      const lines = content.split('\n');
      
      const lineSpec = parseRange(lineRange);
      const charSpec = parseRange(charRange);

      let result = content;
      
      if (lineSpec) {
        const startLine = Math.max(0, lineSpec.start - 1);
        const endLine = lineSpec.end ? Math.min(lines.length, lineSpec.end) : startLine + 1;
        result = lines.slice(startLine, endLine).join('\n');
        
        if (charSpec) {
          const startChar = Math.max(0, charSpec.start - 1);
          const endChar = charSpec.end ? Math.min(result.length, charSpec.end) : startChar + 1;
          result = result.slice(startChar, endChar);
        }
      } else if (charSpec) {
        const startChar = Math.max(0, charSpec.start - 1);
        const endChar = charSpec.end ? Math.min(result.length, charSpec.end) : startChar + 1;
        result = result.slice(startChar, endChar);
      }

      return {
        path: absolutePath,
        content: result,
        metadata: {
          lineRange: lineSpec,
          charRange: charSpec,
          totalLines: lines.length,
          totalChars: content.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});
