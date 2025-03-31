#!/usr/bin/env node
import { program } from 'commander';
import {fileAgent} from './agents/fileAgent.js';
import logger from './utils/logger.js';
import {Mastra} from "@mastra/core";
import {createLogger} from "@mastra/core/logger";


// Main CLI setup
program
  .name('rag-tool')
  .description('Enhanced File Agent CLI')
  .version('1.1.0')
  .option('-m, --model <model>', 'Model to use', 'claude-3-7-sonnet-20250219')
  .option('-w, --workingDir <dir>', 'Base directory for file operations', process.cwd())
  .option('--max-steps <steps>', 'Maximum number of tool execution steps', '15')
  .argument('[task...]', 'Task to perform')
  .action(async (task, options) => {
    try {
      const taskText = task.join(' ');
      
      // If no task provided, show help
      if (!taskText) {
        program.help();
        return;
      }
      
      // Always log task info, but use debug level if not verbose
      const logLevel: 'info' | 'debug' = process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info';
      logger.debug('Executing task', {
        task: taskText,
        workingDir: options.workingDir,
        model: options.model,
        maxSteps: options.maxSteps
      });
      
      // Create the enhanced agent
      const mastra = new Mastra({
        agents: { fileAgent },
        logger: logLevel === 'debug' ? createLogger({ name: 'FileAgent', level: logLevel }) : undefined,
        serverMiddleware: [
          {
            handler: (c, next) => {
              logger.debug('Middleware called');
              return next();
            },
          },
        ],
      });

     const agent = mastra.getAgent('fileAgent');

      // Generate response
      const response = await agent.generate(`${taskText}\n\nWorking Directory: ${options.workingDir}`)

      // Output result
      logger.debug('Task completed successfully');

      // Still use console for the actual output to the user
      console.log(response.text);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error executing task', { error: errorMsg });

      if (error instanceof Error && error.message.includes('x-api-key')) {
        const apiKeyMsg = 'Please ensure you have set the proper API key for your AI provider';
        logger.error(apiKeyMsg);
        console.error('\n' + apiKeyMsg);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);