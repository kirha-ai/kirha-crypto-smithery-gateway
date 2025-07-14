import { z } from "zod";

export const configSchema = z.object({
  apiKey: z.string().describe("Your API key for tool planning"),
});

export const configFileSchema = z.object({
  mcp: z.object({
    name: z.string(),
    version: z.string(),
  }),
  tool: z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
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

export type Config = z.infer<typeof configSchema>;
export type ConfigFile = z.infer<typeof configFileSchema>;
export type ToolConfig = ConfigFile["tool"];

export interface ToolRegistrationContext {
  apiKey: string;
  config: ConfigFile;
  toolConfig: ToolConfig;
}

