#!/usr/bin/env node
import { program } from 'commander';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { fileAgent } from './agents/fileAgent';

program
  .name('agent-script')
  .description('CLI for Mastra File Agent')
  .version('1.0.0')
  .option('-p, --provider <provider>', 'AI provider (anthropic or openai)', 'anthropic')
  .option('-m, --model <model>', 'Model to use', 
    provider => provider === 'openai' ? 'gpt-4-turbo' : 'claude-3-sonnet-20240229')
  .option('-v, --verbose', 'Show detailed execution output', false)
  .option('-w, --workingDir <dir>', 'Base directory for file operations', process.cwd())
  .argument('[task...]', 'Task to perform')
  .action(async (task, options) => {
    try {
      // Configure agent based on provider
      const provider = options.provider === 'openai' ? openai(options.model) : anthropic(options.model);
      fileAgent.model = provider;
      
      const taskText = task.join(' ');
      if (options.verbose) {
        console.log(`Executing task with ${options.provider} (${options.model}) in ${options.workingDir}: ${taskText}`);
      }

      const result = await fileAgent.generate([
        { 
          role: 'user', 
          content: taskText,
          workingDir: options.workingDir,
          verbose: options.verbose
        }
      ], {
        maxSteps: 10
      });

      console.log('\nResult:');
      console.log(result.text);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
