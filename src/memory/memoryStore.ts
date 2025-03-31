import path from 'path';
import os from 'os';
import { Memory } from '@mastra/memory';
import fs from 'fs';

/**
 * Configuration for the RAG Tool memory store
 */
export interface MemoryConfig {
  /** Number of recent messages to keep in memory */
  lastMessages?: number;
  /** Path to store the memory database */
  dbPath?: string;
  /** Configuration for semantic recall */
  semanticRecall?: {
    /** Number of similar messages to retrieve */
    topK?: number;
    /** Range of messages to consider */
    messageRange?: number;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  lastMessages: 20,
  dbPath: path.join(os.homedir(), '.rag-tool', 'memory.db'),
  semanticRecall: {
    topK: 5,
    messageRange: 3
  }
};

/**
 * Creates a memory instance for the agent
 */
export function createMemoryStore(config: MemoryConfig = {}): Memory {
  // Merge provided config with defaults
  const finalConfig: MemoryConfig = {
    ...DEFAULT_MEMORY_CONFIG,
    ...config,
    semanticRecall: {
      ...DEFAULT_MEMORY_CONFIG.semanticRecall,
      ...config.semanticRecall
    }
  };

  // Ensure the directory exists
  const dbDir = path.dirname(finalConfig.dbPath!);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create memory instance with proper type handling
  return new Memory({
    options: {
      lastMessages: finalConfig.lastMessages || DEFAULT_MEMORY_CONFIG.lastMessages,
      semanticRecall: finalConfig.semanticRecall && {
        topK: finalConfig.semanticRecall.topK || DEFAULT_MEMORY_CONFIG.semanticRecall!.topK!,
        messageRange: finalConfig.semanticRecall.messageRange || DEFAULT_MEMORY_CONFIG.semanticRecall!.messageRange!
      }
    }
  });
}

/**
 * Generate a thread ID based on directory path
 * This allows for maintaining context within a directory
 */
export function getThreadIdForDirectory(directory: string): string {
  return `dir-${Buffer.from(directory).toString('base64url')}`;
}

/**
 * Generate a resource ID for a specific file
 * This allows for maintaining file-specific memory
 */
export function getResourceIdForFile(filePath: string): string {
  return `file-${Buffer.from(filePath).toString('base64url')}`;
}