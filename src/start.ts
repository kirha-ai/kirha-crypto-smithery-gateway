#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import createStatelessServer from "./index.js";

// Get configuration from environment or defaults
const config = {
    apiKey: process.env.API_KEY || "",
    debug: process.env.DEBUG === "true",
    configPath: process.env.CONFIG_PATH
};

const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id']
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Helper function to parse query parameters with dot notation
function parseQueryParams(query: any): any {
    const result: any = {};
    
    // First, check if there's a base64-encoded config parameter
    if (query.config) {
        try {
            const decodedConfig = JSON.parse(Buffer.from(query.config, "base64").toString());
            Object.assign(result, decodedConfig);
        } catch (error) {
            console.error('Error parsing base64 config:', error);
        }
    }
    
    // Then parse dot-notation parameters
    for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'string' && key !== 'config' && key !== 'api_key' && key !== 'profile') {
            const keys = key.split('.');
            let current = result;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
        }
    }
    
    return result;
}

// MCP endpoint - handle both GET and POST
const handleMcpRequest = async (req: any, res: any, body?: any) => {
    // Parse configuration from query parameters
    const queryConfig = parseQueryParams(req.query);

    const userApiKey = queryConfig.apiKey || config.apiKey || "";
    
    const requestConfig = {
        ...config,
        ...queryConfig,
        apiKey: userApiKey,
        debugInfo: {
            rawQuery: req.query,
            parsedQuery: queryConfig,
            defaultApiKey: config.apiKey || "none",
            userConfiguredApiKey: queryConfig.apiKey || "none",
            finalApiKey: userApiKey || "none",
            queryKeys: Object.keys(req.query),
            hasConfigParam: !!req.query.config
        }
    };
    
    const server = createStatelessServer({ config: requestConfig });
    
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Stateless mode
        });
        
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        
        res.on('close', () => {
            if (requestConfig.debug) {
                console.log('Request closed');
            }
            transport.close();
            server.close();
        });
    } catch (error) {
        console.error('Error handling MCP request:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
};

app.post('/mcp', (req, res) => handleMcpRequest(req, res, req.body));

// Handle GET requests to /mcp (for SSE streams)
app.get('/mcp', (req, res) => handleMcpRequest(req, res));

// Handle DELETE requests to /mcp (for session termination)
app.delete('/mcp', (req, res) => handleMcpRequest(req, res));

// Start the server
const PORT = parseInt(process.env.PORT || '8080', 10);

app.listen(PORT, (error?: Error) => {
    if (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    process.exit(0);
});