import { Mastra } from "@mastra/core";
import { fileAgent } from "./agents/fileAgent";
import { task } from "./tools/task";

export const mastra = new Mastra({
  agents: { fileAgent }
});

export { fileAgent, task } from "./agents/fileAgent";
