import { Agent } from "@mastra/core/agent";
import { anthropic } from '@ai-sdk/anthropic';

// Import logger
import { createLoggedTool } from '../utils/loggedTool.js';

// Import tools
import { find } from "../tools/find.js";
import { grep } from "../tools/grep.js";
import { ls } from "../tools/ls.js";
import { cat } from "../tools/cat.js";
import { read } from "../tools/read.js";

// Default configurations
const DEFAULT_MODEL = "claude-3-7-sonnet-20250219";
const DEFAULT_INSTRUCTIONS = `
You are an advanced file system assistant that can perform sophisticated file operations.
You have access to several tools for working with files and directories.
Always take the shortest path to the answer.
Think about the most efficient way to solve the problem.
`;

export const fileAgent = new Agent({
  name: "fileAgent",
  model: anthropic(DEFAULT_MODEL),
  instructions: DEFAULT_INSTRUCTIONS,
  tools: {
    find,
    grep,
    ls,
    cat,
    read,
  }
});