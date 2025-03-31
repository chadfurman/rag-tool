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
  description: "Read specific portions of a file with line or character ranges. REQUIRES 'file' parameter with the path.",
  inputSchema: z.object({
    file: z.string().describe("REQUIRED: Path to the file to read. Example: 'src/index.ts', '/etc/hosts'"),
    lineRange: z.string().optional().describe("Line range in format 'start:end' or single line. Example: '10:20', '5'"),
    charRange: z.string().optional().describe("Character range in format 'start:end' or single offset. Example: '100:200', '50'")
  }),
  execute: async (args) => {
    // Safely extract parameters
    const { context } = args;
    const file = context.file;
    const lineRange = context.lineRange;
    const charRange = context.charRange;
    
    // If required parameter is missing, throw a clear error
    if (!file) {
      throw new Error('Missing required parameter: file');
    }
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
