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

function getCurrentDirname() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
  }
  
  return process.cwd();
}

const __dirname = getCurrentDirname();

export { configSchema };

function loadConfig(): ConfigFile {
  const path = __dirname === process.cwd() ?
    join(__dirname, "config.json") : 
    join(dirname(__dirname), "config.json");

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
  const appConfig = loadConfig();
  
  const server = new McpServer({
    name: appConfig.mcp.name,
    version: appConfig.mcp.version,
  });

  const toolConfig = appConfig.tool;
  
  try {
    registerToolPlanningTool(server, {
      config: appConfig,
      toolConfig,
      requestConfig: config,
    });
  } catch (error) {
    console.error(`Failed to register tool ${toolConfig.name}:`, error);
  }

  return server.server;
}