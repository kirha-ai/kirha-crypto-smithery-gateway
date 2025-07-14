import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { registerToolPlanningTool } from "./tools/toolPlanning.js";
import { 
  configSchema, 
  configFileSchema, 
  Config, 
  ConfigFile, 
  ToolConfig,
  AvailableTool 
} from "./types.js";

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Export the schema for external use
export { configSchema };

// Available tools mapping
const availableTools: Record<string, AvailableTool> = {
  "execute-crypto-tool-planning": {
    name: "execute-crypto-tool-planning",
    register: registerToolPlanningTool,
  },
  "execute-your-tool-planning": {
    name: "execute-your-tool-planning", 
    register: registerToolPlanningTool,
  },
};

// Load configuration from JSON file
function loadConfig(configPath?: string): ConfigFile {
  const defaultPath = join(dirname(__dirname), "config.json");
  const path = configPath || defaultPath;
  
  try {
    const configData = readFileSync(path, "utf-8");
    const config = JSON.parse(configData);
    return configFileSchema.parse(config);
  } catch (error) {
    console.error(`Error loading configuration from ${path}:`, error);
    throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default function createStatelessServer({
  config,
}: {
  config: Config;
}) {
  // Load configuration from JSON file
  const appConfig = loadConfig(config.configPath);
  
  if (config.debug) {
    console.log("Loaded configuration:", JSON.stringify(appConfig, null, 2));
  }
  
  // Create MCP server
  const server = new McpServer({
    name: appConfig.mcp.name,
    version: appConfig.mcp.version,
  });

  // Register the single tool if it's enabled
  const toolConfig = appConfig.tool;
  const toolName = toolConfig.name;
  const availableTool = availableTools[toolName as keyof typeof availableTools];
  
  if (availableTool && toolConfig.enabled) {
    try {
      availableTool.register(server, {
        apiKey: config.apiKey,
        config: appConfig,
        toolConfig,
        debug: config.debug,
      });
      
      if (config.debug) {
        console.log(`Registered tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Failed to register tool ${toolName}:`, error);
    }
  } else if (config.debug) {
    console.log(`Skipping tool: ${toolName} (not available or disabled)`);
  }

  return server.server;
}