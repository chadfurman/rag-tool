import { Agent } from "@mastra/core/agent";
import { find } from "../tools/find.js";
import { grep } from "../tools/grep.js";
import { ls } from "../tools/ls.js";
import { cat } from "../tools/cat.js";
import { read } from "../tools/read.js";
import { task } from "../tools/task.js";
import { createAnthropic } from '@ai-sdk/anthropic';

// Get API key from environment variable
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("Warning: ANTHROPIC_API_KEY environment variable is not set");
}

// Create a custom Anthropic provider with explicit API key
const anthropicProvider = createAnthropic({
  apiKey: apiKey
});

// Create default model
const defaultModel = anthropicProvider('claude-3-7-sonnet-20250219');

export const fileAgent: Agent = new Agent({
  name: "File Agent",
  model: defaultModel,
  instructions: `
    You are a helpful assistant that can perform file system operations.
    You have access to tools for finding, reading, and searching files.
    For complex tasks, break them down into steps and use the appropriate tools.
    Always verify the results of each step before proceeding.
  `,
  tools: {
    find,
    grep,
    ls,
    cat,
    read,
    task
  }
});
