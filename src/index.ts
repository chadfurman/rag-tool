import { Mastra } from "@mastra/core";
import { fileAgent } from "./agents/fileAgent";

export const mastra = new Mastra({
  agents: { fileAgent }
});

export { fileAgent } from "./agents/fileAgent";
