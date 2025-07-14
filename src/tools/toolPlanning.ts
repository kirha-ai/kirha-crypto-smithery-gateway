import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolRegistrationContext } from "../types.js";


// Define the input schema for the tool
const toolInputSchema = {
  query: z.string().describe("Your question or query to be processed"),
};

export function registerToolPlanningTool(server: McpServer, context: ToolRegistrationContext) {
  const { apiKey, config, toolConfig } = context;
  
  server.tool(
    toolConfig.name,
    toolConfig.description,
    toolInputSchema,
    async (args) => {
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
        return {
          content: [{ 
            type: "text" as const, 
            text: JSON.stringify(result, null, 2) 
          }] 
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return { 
          content: [{ 
            type: "text" as const, 
            text: `Error: ${errorMessage}` 
          }] 
        };
      }
    }
  );
}