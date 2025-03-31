#!/usr/bin/env node

import { program } from 'commander';
import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';
import { fileAgent } from './src/agents/fileAgent.js';

// Get API key from environment variable
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Anthropic with API key
const model = anthropic('claude-3-sonnet-20240229', {
  apiKey: apiKey
});

// Parse command line arguments
program
  .name('agent-script')
  .description('CLI for Mastra File Agent')
  .version('1.0.0')
  .option('-v, --verbose', 'Show detailed execution output', false)
  .option('-w, --workingDir <dir>', 'Base directory for file operations', process.cwd())
  .argument('[task...]', 'Task to perform')
  .action(async (task, options) => {
    try {
      const taskText = task.join(' ');
      
      if (options.verbose) {
        console.log(`Executing task with Anthropic in ${options.workingDir}: ${taskText}`);
      }

      const agent = new Agent({
        name: fileAgent.name,
        model: model,
        instructions: fileAgent.instructions,
        tools: fileAgent.tools
      });

      const result = await agent.generate([
        { 
          role: 'user', 
          content: `${taskText}\n\nWorking Directory: ${options.workingDir}\nVerbose: ${options.verbose}`
        }
      ], {
        maxSteps: 10
      });

      console.log('\nResult:');
      console.log(result.text);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.message.includes('x-api-key')) {
        console.error('\nPlease ensure you have set the proper API key for your AI provider');
      }
      process.exit(1);
    }
  });

program.parse(process.argv);