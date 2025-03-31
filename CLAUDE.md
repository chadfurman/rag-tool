# RAG Tool Development Guidelines

## Build/Run Commands
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled code with Node.js
- `npm run agent` - Run directly with tsx from TypeScript
- `npm run dev` - Watch for changes and run with tsx

## Code Style Guidelines
- **Project Structure**: TypeScript with ES modules, source in `src/`, output in `dist/`
- **Imports**: Use ES module imports with `.js` extensions (e.g., `import { task } from "../tools/task.js"`)
- **Types**: Use Zod schemas for validation, define explicit types, use TypeScript generics
- **Naming**: camelCase for variables/functions/files, PascalCase for types/classes
- **Error Handling**: Track errors in execution steps, validate results before proceeding
- **Documentation**: Add JSDoc-style descriptions in schemas and clear tool descriptions

## When modifying code:
- Maintain ES modules with `.js` extensions in imports
- Follow existing directory structure for new tools or agents
- Respect strict type checking and provide comprehensive type annotations
- When making changes or fixes, explain reasoning behind each modification