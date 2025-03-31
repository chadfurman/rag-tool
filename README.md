# RAG Tool

A command-line tool for file operations and search powered by Claude AI. This tool uses a sophisticated file agent to perform complex file operations through natural language commands.

## Features

- Natural language interface for file operations
- Advanced file search and pattern matching
- Content search within files
- Recursive directory operations
- Detailed logging and debugging capabilities

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rag-tool.git
cd rag-tool

# Install dependencies
npm install

# Build the project (optional)
npm run build
```

## Configuration

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

### Basic Command Structure

```bash
npm run agent -- "your command here"
```

### Example Commands

```bash
# Find TypeScript files in the src directory
npm run agent -- "Find all TypeScript files in src directory"

# Search for specific content in files
npm run agent -- "Search for 'createTool' string in all typescript files"

# List files in a directory
npm run agent -- "List all files in the project root"

# Complex operations
npm run agent -- "Find all TypeScript files and count the lines of code in each"
```

### Logging

You can enable debug-level logging by setting the LOG_LEVEL environment variable:

```bash
export LOG_LEVEL=debug && npm run agent -- "your command"
```

## Available Tools

The agent has access to the following tools:

- **find**: Search for files by name pattern
  - Example: `find({pattern: "*.ts", directory: "src", recursive: true})`
  
- **ls**: List files in a directory
  - Example: `ls({path: "src/tools"})`
  
- **grep**: Search inside files for text patterns
  - Example: `grep({pattern: "function", file: "src/index.ts"})`
  
- **cat**: View a file's complete contents
  - Example: `cat({file: "package.json"})`
  
- **read**: Read specific lines/portions of a file
  - Example: `read({file: "src/index.ts", lineRange: "10:20"})`

## Development

### Project Structure

```
rag-tool/
├── src/
│   ├── agents/           # Agent definitions
│   ├── tools/            # Tool implementations
│   ├── utils/            # Utility functions and helpers
│   └── cli.ts            # Command-line interface
├── package.json
└── tsconfig.json
```

### Available Scripts

- `npm run agent`: Run the agent with a command
- `npm run build`: Build the project
- `npm run dev`: Run the agent in development mode with auto-reload

## License

ISC