import { Agent } from "@mastra/core/agent";
import { find } from "../tools/find";
import { grep } from "../tools/grep";
import { ls } from "../tools/ls";
import { cat } from "../tools/cat";
import { read } from "../tools/read";

export const fileAgent = new Agent({
  name: "File Agent",
  instructions: `
    You are a helpful assistant that can perform file system operations.
    You have access to tools for finding, reading, and searching files.
    Use the appropriate tool based on the user's request.
  `,
  tools: {
    find,
    grep,
    ls,
    cat,
    read
  }
});
