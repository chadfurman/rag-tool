# Mastra File Toolkit Agent Plan

## Overview
Create a Mastra agent with tools for file system operations:
- `find` - Search for files by name/pattern
- `grep` - Search file contents with line/character positions
- `ls` - List directory contents  
- `cat` - Output full file contents
- `read` - Advanced file reading with line/character ranges

## Project Structure
```
mastra-file-toolkit/
├── src/
│   ├── tools/
│   │   ├── find.ts
│   │   ├── grep.ts
│   │   ├── ls.ts
│   │   ├── cat.ts
│   │   └── read.ts
│   ├── agents/
│   │   └── fileAgent.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Tool Specifications

### 1. Find Tool
- **Purpose**: Locate files by name/pattern
- **Input Schema**:
  - `pattern`: string (required) - Search pattern
  - `recursive`: boolean - Search subdirectories
- **Output**: Array of absolute file paths

### 2. Grep Tool  
- **Purpose**: Search file contents
- **Input Schema**:
  - `pattern`: string (required) - Search regex
  - `file`: string (required) - File to search
- **Output**: Array of matches with:
  - file path
  - line number
  - character offset
  - matched line

### 3. Ls Tool
- **Purpose**: List directory contents
- **Input Schema**:
  - `path`: string - Directory path (default: cwd)
- **Output**: Array of file/directory names

### 4. Cat Tool
- **Purpose**: Output file contents
- **Input Schema**:
  - `file`: string (required) - File to read
- **Output**: Complete file contents

### 5. Read Tool
- **Purpose**: Advanced file reading
- **Input Schema**:
  - `file`: string (required) - File to read
  - `lineRange`: string - "start:end" or single line
  - `charRange`: string - "start:end" or single offset
- **Output**: Requested portion of file contents

## Agent Implementation
The file agent will:
1. Parse natural language commands
2. Determine required tool sequence
3. Execute tools with proper parameters
4. Compile and return results

## Development Steps
1. Set up TypeScript project
2. Implement each tool with Zod schemas
3. Create the file agent
4. Test individual tools
5. Test end-to-end agent operation
6. Add error handling and edge cases

## Dependencies
- @mastra/core
- zod
- @types/node
- typescript
