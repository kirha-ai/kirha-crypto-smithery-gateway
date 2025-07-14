#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createStatelessServer from "../dist/index.js";

const defaultConfig = {
  debug: false,
  apiKey: process.env.API_KEY || "",
  configPath: undefined
};

const args = process.argv.slice(2);
const config = { ...defaultConfig };

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--debug") {
    config.debug = true;
  } else if (arg === "--api-key" && i + 1 < args.length) {
    config.apiKey = args[i + 1];
    i++;
  } else if (arg === "--config" && i + 1 < args.length) {
    config.configPath = args[i + 1];
    i++;
  }
}

if (!config.apiKey) {
  console.error("Error: API key is required. Set API_KEY environment variable or use --api-key");
  process.exit(1);
}

async function main() {
  try {
    const server = createStatelessServer({ config });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    if (config.debug) {
      console.error("MCP server started successfully");
    }
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});