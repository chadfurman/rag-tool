import { Agent } from "@mastra/core/agent";
import { createAnthropic } from '@ai-sdk/anthropic';
import { createMemoryStore, getThreadIdForDirectory } from "../memory/memoryStore.js";

// Import tools
import { find } from "../tools/find.js";
import { grep } from "../tools/grep.js";
import { ls } from "../tools/ls.js";
import { cat } from "../tools/cat.js";
import { read } from "../tools/read.js";
import { task } from "../tools/task.js";

// Default configurations
const DEFAULT_MODEL = "claude-3-7-sonnet-20250219";
const DEFAULT_INSTRUCTIONS = `
You are an advanced file system assistant that can perform sophisticated file operations.
You have access to tools for finding, reading, searching, and analyzing files.
For complex tasks, break them down into steps and use the appropriate tools.
Always verify the results of each step before proceeding.

YOUR WORKING MEMORY:
<memory>
- Current task: None
- Recent files: []
- Recent directories: []
- Search history: []
</memory>

You can update your working memory as you process tasks. Keep track of:
1. Files you've accessed
2. Directories you've searched
3. Patterns you've looked for
4. Search context for the current task

Use pagination for large file sets and efficient directory traversal.
When encountering errors, try alternative approaches before giving up.
`;

/**
 * Configuration options for the enhanced file agent
 */
export interface EnhancedFileAgentConfig {
  /** API Key for the AI provider */
  apiKey?: string;
  /** Model ID to use */
  modelId?: string;
  /** Custom instructions for the agent */
  instructions?: string;
  /** Whether to use memory for persistence */
  useMemory?: boolean;
  /** Memory configuration */
  memoryConfig?: {
    /** Number of recent messages to keep in memory */
    lastMessages?: number;
    /** Path to the memory database */
    dbPath?: string;
  };
  /** Maximum steps for tool execution */
  maxSteps?: number;
}

/**
 * Creates an enhanced file agent with memory and improved tools
 */
export function createEnhancedFileAgent(config: EnhancedFileAgentConfig = {}): Agent {
  // Get API key
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Warning: No API key provided. Set ANTHROPIC_API_KEY environment variable or pass apiKey in config.");
  }

  // Create the model
  const modelId = config.modelId || DEFAULT_MODEL;
  const anthropicProvider = createAnthropic({ apiKey });
  const model = anthropicProvider(modelId);

  // Create memory if enabled
  const memory = config.useMemory !== false 
    ? createMemoryStore(config.memoryConfig)
    : undefined;

  // Create the agent with enhanced configuration
  return new Agent({
    name: "Enhanced File Agent",
    model,
    memory,
    instructions: config.instructions || DEFAULT_INSTRUCTIONS,
    tools: {
      find,
      grep,
      ls,
      cat,
      read,
      task
    }
  });
}

/**
 * Generate an agent with a specific working directory context
 */
export async function generateWithDirectoryContext(
  agent: Agent,
  prompt: string,
  workingDir: string,
  options: {
    verbose?: boolean;
    maxSteps?: number;
  } = {}
) {
  // If memory is available, use thread ID based on directory
  const threadId = getThreadIdForDirectory(workingDir);
  
  // Create a resource ID based on the prompt
  const resourceId = `task-${Buffer.from(prompt).toString('base64url').substring(0, 10)}`;
  
  // Return generated response
  return agent.generate(
    [
      {
        role: "user",
        content: `${prompt}\n\nWorking Directory: ${workingDir}`
      }
    ],
    {
      maxSteps: options.maxSteps || 15,
      threadId, // Thread ID based on directory
      resourceId // Resource ID based on task
    }
  );
}