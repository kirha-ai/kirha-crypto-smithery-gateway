# Kirha Smithery Gateway
<p align="center">
  <a href="https://kirha.ai" target="_blank">
    <img src="https://raw.githubusercontent.com/kirha-ai/kirha-mcp-gateway/refs/heads/main/assets/logo.png" width="2500" alt="Kirha Logo">
  </a>
</p>
A configurable MCP (Model Context Protocol) server for Kirha tool planning ready to use with Smithery
## Features

- **JSON Configuration**: Easily configure tools, verticals, and API endpoints
- **Dynamic Tool Registration**: Tools are registered based on configuration
- **Session-Based API Keys**: Each session gets its own API key for secure tool execution
- **Debug Mode**: Optional debug logging for development
- **Modular Architecture**: Clean separation of concerns with tools in separate files

## Configuration

### Environment Configuration (smithery.yaml)

```yaml
runtime: "container"
startCommand:
  type: "http"
  configSchema:
    type: "object"
    properties:
      apiKey:
        type: "string"
        description: "Your API key"
      debug:
        type: "boolean"
        description: "Enable debug logging"
        default: false
      configPath:
        type: "string"
        description: "Path to custom configuration file"
    required: ["apiKey"]
```

### JSON Configuration (config.json)

```json
{
  "mcp": {
    "name": "kirha-crypto",
    "version": "1.0.0"
  },
  "tool": {
    "name": "execute-crypto-tool-planning",
    "title": "Crypto Tool Planning",
    "description": "Execute crypto-related tool planning",
    "enabled": true
  },
  "vertical": "crypto",
  "api": {
    "executeToolPlanningUrl": "https://api.kirha.ai/chat/v1/tool-planning/execute",
    "summarization": {
      "enable": true,
      "model": "kirha-flash"
    }
  }
}
```

## Creating Forks

To create a fork for a different vertical:

1. Copy `config.example.json` to `config.json`
2. Update the configuration:
   - Change `mcp.name` to your vertical name
   - Update `vertical` to your vertical ID
   - Modify `tool` object with your specific tool
   - Update `tool.name`, `tool.title`, and `tool.description`

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── types.ts              # Type definitions
└── tools/
    └── toolPlanning.ts   # Tool planning implementation
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start built server
npm start
```

## Adding New Tools

1. Create a new file in `src/tools/` (e.g., `newTool.ts`)
2. Implement the tool registration function following the `ToolRegistrationFunction` type
3. Add the tool to the `availableTools` mapping in `src/index.ts`
4. Update your `config.json` to include the new tool

## Session Management

- Each client connection gets its own API key from Smithery
- Configuration is bound at connection time
- Tools have access to session-specific configuration
- API keys are securely passed to tool execution functions

## Debug Mode

Enable debug mode by setting `debug: true` in the session configuration:

```
GET /mcp?apiKey=your-key&debug=true
```

This will log:
- Configuration loading
- Tool registration
- Tool execution
- Error details