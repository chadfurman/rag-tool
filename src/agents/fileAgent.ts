import { Agent } from "@mastra/core";
import { find } from "../tools/find.js";
import { grep } from "../tools/grep.js";
import { ls } from "../tools/ls.js";
import { cat } from "../tools/cat.js";
import { read } from "../tools/read.js";
import { task } from "../tools/task.js";
import { anthropic } from '@ai-sdk/anthropic';

// Create default model configuration
const defaultModel = anthropic('claude-3-sonnet-20240229');

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
