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
  ToolConfig
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export { configSchema };

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
  let appConfig: ConfigFile;
  let serverName = "kirha-gateway";
  let serverVersion = "1.0.0";
  
  try {
    appConfig = loadConfig(config.configPath);
    serverName = appConfig.mcp.name;
    serverVersion = appConfig.mcp.version;
    
    if (config.debug) {
      console.log("Loaded configuration:", JSON.stringify(appConfig, null, 2));
    }
  } catch (error) {
    if (config.debug) {
      console.log("Configuration not available during tool discovery, using defaults");
    }
    appConfig = {
      mcp: { name: serverName, version: serverVersion },
      tool: {
        name: "execute-tool-planning",
        title: "Tool Planning",
        description: "Execute tool planning with your configured vertical",
        enabled: true
      },
      vertical: "default",
      api: {
        executeToolPlanningUrl: "https://api.kirha.ai/chat/v1/tool-planning/execute",
        summarization: { enable: true, model: "kirha-flash" }
      }
    };
  }
  
  const server = new McpServer({
    name: serverName,
    version: serverVersion,
  });

  const toolConfig = appConfig.tool;
  
  if (toolConfig.enabled) {
    try {
      registerToolPlanningTool(server, {
        apiKey: config.apiKey,
        config: appConfig,
        toolConfig,
        debug: config.debug,
        configPath: config.configPath,
      });
      
      if (config.debug) {
        console.log(`Registered tool: ${toolConfig.name}`);
      }
    } catch (error) {
      console.error(`Failed to register tool ${toolConfig.name}:`, error);
    }
  } else if (config.debug) {
    console.log(`Tool disabled: ${toolConfig.name}`);
  }

  return server.server;
}