import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ToolRegistrationContext, configFileSchema, ConfigFile } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function lazyLoadConfig(configPath?: string): ConfigFile {
  const defaultPath = join(dirname(dirname(__dirname)), "config.json");
  const path = configPath || defaultPath;
  
  try {
    const configData = readFileSync(path, "utf-8");
    const config = JSON.parse(configData);
    return configFileSchema.parse(config);
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function registerToolPlanningTool(server: McpServer, context: ToolRegistrationContext) {
  const { apiKey, toolConfig, debug, configPath } = context;
  
  if (debug) {
    console.log(`Registering tool: ${toolConfig.name}`);
  }

  server.tool(
    toolConfig.name,
    toolConfig.description,
    {
      title: toolConfig.title,
      query: z.string().describe("Your question or query to be processed"),
    },
    async (args) => {
      if (debug) {
        console.log(`Executing tool ${toolConfig.name} with query:`, args.query);
      }

      try {
        const actualConfig = lazyLoadConfig(configPath);
        
        if (debug) {
          console.log(`Loaded configuration for execution: ${actualConfig.vertical}`);
        }

        const response = await fetch(actualConfig.api.executeToolPlanningUrl, {
          method: "POST",
          body: JSON.stringify({
            mode: "auto",
            query: args.query,
            vertical_id: actualConfig.vertical,
            summarization: actualConfig.api.summarization,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (debug) {
          console.log(`Tool ${toolConfig.name} executed successfully`);
        }

        return { 
          content: [{ 
            type: "text" as const, 
            text: JSON.stringify(result, null, 2) 
          }] 
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (debug) {
          console.error(`Tool ${toolConfig.name} execution failed:`, errorMessage);
        }

        return { 
          content: [{ 
            type: "text" as const, 
            text: `Error: ${errorMessage}` 
          }] 
        };
      }
    }
  );

  if (debug) {
    console.log(`Successfully registered tool: ${toolConfig.name}`);
  }
}