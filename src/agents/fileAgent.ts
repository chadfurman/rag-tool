import { Agent } from "@mastra/core/agent";
import { find } from "../tools/find";
import { grep } from "../tools/grep";
import { ls } from "../tools/ls";
import { cat } from "../tools/cat";
import { read } from "../tools/read";
import { task } from "../tools/task";

export const fileAgent = new Agent({
  name: "File Agent",
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
