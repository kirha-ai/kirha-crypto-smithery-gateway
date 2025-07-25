import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolRegistrationContext } from "../types.js";


const toolInputSchema = {
  query: z.string().describe("Your question or query to be processed"),
};

export function registerToolPlanningTool(server: McpServer, context: ToolRegistrationContext) {
  const { config, toolConfig, requestConfig } = context;
  
  server.tool(
    toolConfig.name,
    toolConfig.description,
    toolInputSchema,
    async (args) => {
      const apiKey = requestConfig.apiKey;
      
      if (!apiKey) {
        // Return detailed debugging info when API key is missing
        const debugInfo = {
          error: "API key is required to execute this tool",
          debug: {
            requestConfigKeys: Object.keys(requestConfig),
            hasApiKey: !!requestConfig.apiKey,
            apiKeyValue: requestConfig.apiKey,
            fullRequestConfig: requestConfig
          }
        };
        
        return { 
          content: [{ 
            type: "text" as const, 
            text: `DEBUG: ${JSON.stringify(debugInfo, null, 2)}` 
          }] 
        };
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