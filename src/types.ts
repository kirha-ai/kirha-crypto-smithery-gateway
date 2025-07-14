import { z } from "zod";

// Configuration schema for the MCP server
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
  configPath: z.string().optional().describe("Path to custom configuration file"),
  apiKey: z.string().describe("Your API key for tool planning"),
});

// JSON configuration file schema
export const configFileSchema = z.object({
  mcp: z.object({
    name: z.string(),
    version: z.string(),
  }),
  tool: z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    enabled: z.boolean().default(true),
  }),
  vertical: z.string(),
  api: z.object({
    executeToolPlanningUrl: z.string(),
    summarization: z.object({
      enable: z.boolean(),
      model: z.string(),
    }),
  }),
});

// Type definitions
export type Config = z.infer<typeof configSchema>;
export type ConfigFile = z.infer<typeof configFileSchema>;
export type ToolConfig = ConfigFile["tool"];

// Tool registration context
export interface ToolRegistrationContext {
  apiKey: string;
  config: ConfigFile;
  toolConfig: ToolConfig;
  debug: boolean;
}

// Tool registration function type
export type ToolRegistrationFunction = (
  server: any,
  context: ToolRegistrationContext
) => void;

// Available tool definition
export interface AvailableTool {
  name: string;
  register: ToolRegistrationFunction;
}