import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolRegistrationContext } from "../types.js";

// Register the tool planning tool
export function registerToolPlanningTool(server: McpServer, context: ToolRegistrationContext) {
  const { apiKey, config, toolConfig, debug } = context;
  
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
        const response = await fetch(config.api.executeToolPlanningUrl, {
          method: "POST",
          body: JSON.stringify({
            mode: "auto",
            query: args.query,
            vertical_id: config.vertical,
            summarization: config.api.summarization,
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