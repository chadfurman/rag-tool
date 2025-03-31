#!/usr/bin/env node
import { program } from 'commander';
import { createEnhancedFileAgent, generateWithDirectoryContext } from './agents/enhancedFileAgent.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Default configuration file path
const CONFIG_DIR = path.join(os.homedir(), '.rag-tool');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Create the config directory if it doesn't exist
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.warn(`Warning: Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Load configuration
async function loadConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    // If the file doesn't exist or can't be parsed, return empty config
    return {};
  }
}

// Save configuration
async function saveConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn(`Warning: Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Main CLI setup
program
  .name('rag-tool')
  .description('Enhanced File Agent CLI')
  .version('1.1.0')
  .option('-m, --model <model>', 'Model to use', 'claude-3-7-sonnet-20250219')
  .option('-v, --verbose', 'Show detailed execution output', false)
  .option('-w, --workingDir <dir>', 'Base directory for file operations', process.cwd())
  .option('--no-memory', 'Disable persistent memory')
  .option('--max-steps <steps>', 'Maximum number of tool execution steps', '15')
  .option('--save-config', 'Save current options as default config')
  .option('--reset-memory', 'Reset the agent memory store')
  .argument('[task...]', 'Task to perform')
  .action(async (task, options) => {
    try {
      await ensureConfigDir();
      const config = await loadConfig();
      
      // Save config if requested
      if (options.saveConfig) {
        const configToSave = {
          model: options.model,
          useMemory: options.memory,
          maxSteps: parseInt(options.maxSteps, 10),
          memoryConfig: {
            dbPath: path.join(CONFIG_DIR, 'memory.db')
          }
        };
        await saveConfig(configToSave);
        if (task.length === 0) {
          console.log('Configuration saved successfully.');
          return;
        }
      }
      
      // Reset memory if requested
      if (options.resetMemory) {
        try {
          await fs.unlink(path.join(CONFIG_DIR, 'memory.db'));
          console.log('Memory store reset successfully.');
          if (task.length === 0) {
            return;
          }
        } catch (error) {
          console.warn(`Warning: Failed to reset memory: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      const taskText = task.join(' ');
      
      // If no task provided, show help
      if (!taskText) {
        program.help();
        return;
      }
      
      if (options.verbose) {
        console.log(`Executing task: ${taskText}`);
        console.log(`Working directory: ${options.workingDir}`);
        console.log(`Model: ${options.model}`);
        console.log(`Memory: ${options.memory ? 'Enabled' : 'Disabled'}`);
        console.log(`Max steps: ${options.maxSteps}`);
      }
      
      // Create the enhanced agent
      const agent = createEnhancedFileAgent({
        modelId: options.model,
        useMemory: options.memory,
        maxSteps: parseInt(options.maxSteps, 10),
        memoryConfig: {
          dbPath: path.join(CONFIG_DIR, 'memory.db')
        }
      });
      
      // Generate response
      const result = await generateWithDirectoryContext(
        agent,
        taskText,
        options.workingDir,
        {
          verbose: options.verbose,
          maxSteps: parseInt(options.maxSteps, 10)
        }
      );
      
      // Output result
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