import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { fileAgent } from "../agents/fileAgent";

export const task = createTool({
  id: "File Task",
  description: "Execute multi-step file operations and provide a summary",
  inputSchema: z.object({
    prompt: z.string().describe("The task to accomplish with files")
  }),
  execute: async ({ context: { prompt } }, { signal }) => {
    let steps: Array<{
      action: string;
      result: any;
      status: 'success' | 'error';
    }> = [];

    const response = await fileAgent.generate(
      [
        {
          role: "user",
          content: `Plan and execute this file task: ${prompt}\n\n` +
            "Provide a step-by-step plan first, then execute each step using the available tools."
        }
      ],
      {
        maxSteps: 10,
        onStepFinish: ({ text, toolCalls, toolResults }) => {
          if (toolCalls?.length) {
            steps.push({
              action: `Called ${toolCalls.map(t => t.toolName).join(', ')}`,
              result: toolResults,
              status: 'success'
            });
          }
        },
        signal
      }
    );

    // Generate summary
    const summary = await fileAgent.generate([
      {
        role: "user",
        content: `Summarize the results of this file task:\n\n` +
          `Original task: ${prompt}\n\n` +
          `Steps taken:\n${steps.map(s => `- ${s.action}`).join('\n')}\n\n` +
          `Provide a concise summary of what was done and any next steps.`
      }
    ]);

    return {
      task: prompt,
      steps,
      summary: summary.text,
      status: steps.every(s => s.status === 'success') ? 'completed' : 'partial'
    };
  }
});
