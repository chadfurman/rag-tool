#!/usr/bin/env node
import { program } from 'commander';
import { Agent } from '@mastra/core/agent';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { fileAgent } from './agents/fileAgent.js';

program
  .name('agent-script')
  .description('CLI for Mastra File Agent')
  .version('1.0.0')
  .option('-p, --provider <provider>', 'AI provider (anthropic or openai)', 'anthropic')
  .option('-m, --model <model>', 'Model to use', 'claude-3-7-sonnet-20250219')
  .option('-v, --verbose', 'Show detailed execution output', false)
  .option('-w, --workingDir <dir>', 'Base directory for file operations', process.cwd())
  .argument('[task...]', 'Task to perform')
  .action(async (task, options) => {
    try {
      console.debug(`Running task with ${options.provider} (${options.model}) in ${options.workingDir}: ${task.join(' ')}`);
      // Get appropriate API key based on provider
      const apiKey = options.provider === 'openai' 
        ? process.env.OPENAI_API_KEY 
        : process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error(`API key is required. Set ${options.provider.toUpperCase()}_API_KEY environment variable.`);
      }

      console.debug(`Using ${options.provider} API key: ${apiKey.substring(0, 10)}...`);
      // Create provider with explicit API key
      const providerInstance = options.provider === 'openai' 
        ? createOpenAI({ apiKey }) 
        : createAnthropic({ apiKey });
        
      // Create model using provider
      console.debug(`Creating model with ID: "${options.model}"`);
      const model = providerInstance(options.model);
      console.debug(`Model created: ${model ? 'OK' : 'Failed'}`);
      const taskText = task.join(' ');
      
      if (options.verbose) {
        console.log(`Executing task with ${options.provider} (${options.model}) in ${options.workingDir}: ${taskText}`);
      }

      // Create a new agent with the same config but different model
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
