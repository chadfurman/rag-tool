import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { fileAgent } from "../agents/fileAgent.js";
import path from 'path';
import { cwd } from 'process';

type ExecutionStep = {
  tool: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
};

import type { Tool } from "@mastra/core/tools";

export const task: Tool = createTool({
  id: "file-task-orchestrator",
  description: "Orchestrates complex file operations through multi-step planning and execution",
  inputSchema: z.object({
    prompt: z.string().describe("The file operation task to perform"),
    verbose: z.boolean().optional().default(false)
      .describe("Show detailed execution output"),
    workingDir: z.string().optional().default(cwd())
      .describe("Base directory for file operations")
  }),
  execute: async ({ context: { prompt, verbose = false, workingDir = process.cwd() } }, options): Promise<{
    success: boolean;
    workingDir: string;
    steps: number;
    errors: number;
    summary: string;
    details?: any;
  }> => {
    const signal = (options as any)?.signal; // Temporary workaround for typing
    const steps: ExecutionStep[] = [];
    let currentDir = workingDir;

    const updateWorkingDir = (newPath: string) => {
      currentDir = path.isAbsolute(newPath) ? newPath : path.join(currentDir, newPath);
      return currentDir;
    };

    // Phase 1: Planning
    const plan = await fileAgent.generate([
      { 
        role: "system",
        content: `Create an execution plan for: ${prompt}\n\n` +
          `Current directory: ${currentDir}\n\n` +
          "Format each step as:\n" +
          "1. TOOL_NAME - PARAMS_JSON - PURPOSE\n" +
          "Include cd steps when changing directories"
      }
    ], { signal });

    if (verbose) console.log("== Execution Plan ==\n" + plan.text);

    // Phase 2: Execution
    const execResponse = await fileAgent.generate([
      {
        role: "system",
        content: `Execute this task in directory: ${currentDir}\n\n` +
          `Task: ${prompt}\n\n` +
          `Plan:\n${plan.text}\n\n` +
          "Rules:\n" +
          "1. Verify paths are absolute or relative to current directory\n" +
          "2. Handle errors gracefully and continue if possible\n" +
          "3. Store results for summary phase"
      }
    ], {
      maxSteps: 15,
      onStepFinish: async ({ 
        toolCalls, 
        toolResults 
      }: { 
        toolCalls?: Array<{ toolName: string; args: any }>;
        toolResults?: Array<{ success: boolean; output?: any; error?: Error }>;
      }) => {
        if (!toolCalls?.length) return;

        for (let i = 0; i < toolCalls.length; i++) {
          const call = toolCalls[i];
          const result = toolResults?.[i];
          
          // Handle directory changes
          if (call.toolName === 'cd') {
            updateWorkingDir(call.args.path);
            if (verbose) console.log(`Changed directory to: ${currentDir}`);
          }

          steps.push({
            tool: call.toolName,
            args: call.args,
            result: result?.success ? result.output : undefined,
            error: result?.error ? result.error.message : undefined
          });

          if (verbose) {
            console.log(`[Step ${steps.length}] ${call.toolName}:`);
            console.log("Args:", call.args);
            if (result?.error) {
              console.error("Error:", result.error.message);
            } else {
              console.log("Result:", result?.output);
            }
          }
        }
      },
      signal
    });

    // Phase 3: Summary
    const summary = await fileAgent.generate<{text: string}>([
      {
        role: "system",
        content: `Create a summary for task: ${prompt}\n\n` +
          `Working Directory: ${currentDir}\n\n` +
          `Steps Executed:\n${
            steps.map((s, i) => 
              `${i+1}. ${s.tool} - ${JSON.stringify(s.args)}\n` +
              (s.error ? `   ERROR: ${s.error}\n` : '') +
              (s.result ? `   RESULT: ${JSON.stringify(s.result).slice(0, 100)}...\n` : '')
            ).join('\n')
          }\n\n` +
          "Format for CLI output with:\n" +
          "1. Task overview\n" + 
          "2. Key findings\n" +
          "3. Next steps\n" +
          "4. Current directory"
      }
    ], { signal });

    return {
      success: steps.every(s => !s.error),
      workingDir: currentDir,
      steps: steps.length,
      errors: steps.filter(s => s.error).length,
      summary: summary.text,
      details: verbose ? {
        plan: plan.text,
        execution: execResponse.text,
        steps
      } : undefined
    };
  }
});
