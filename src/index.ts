import { Mastra } from "@mastra/core";
import { fileAgent } from "./agents/fileAgent.js";
import { task } from "./tools/task.js";

export const mastra = new Mastra({
  agents: { fileAgent }
});

export { fileAgent, task } from "./agents/fileAgent.js";
