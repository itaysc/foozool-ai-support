declare module '@modelcontextprotocol/sdk/server' {
  export * from '@modelcontextprotocol/sdk/server/transport.js';
  export * from '@modelcontextprotocol/sdk/server/mcp.js';
  export * from '@modelcontextprotocol/sdk/server/stdio.js';
}

declare module '@modelcontextprotocol/sdk/server/transport.js' {
  export interface JSONRPCMessage {
    method: string;
    jsonrpc: '2.0';
    id: string | number;
    params?: {
      [key: string]: unknown;
      _meta?: {
        [key: string]: unknown;
        progressToken?: string | number;
      };
    };
  }

  export interface TransportSendOptions {
    [key: string]: unknown;
  }

  export interface Transport {
    start(): Promise<void>;
    stop(): Promise<void>;
    send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void>;
    receive(): Promise<JSONRPCMessage>;
  }
}

declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  import type { Transport, JSONRPCMessage, TransportSendOptions } from '@modelcontextprotocol/sdk/server/transport.js';
  import type { z } from 'zod';

  export interface McpServerOptions {
    name: string;
    version: string;
    capabilities: {
      resources: Record<string, unknown>;
      tools: Record<string, unknown>;
    };
  }

  export class McpServer {
    constructor(options: McpServerOptions);
    tool(name: string, params: z.ZodType, handler: (params: any) => Promise<{ content: Array<{ type: string; text: string }> }>): void;
    connect(transport: Transport): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  import type { Transport, JSONRPCMessage, TransportSendOptions } from '@modelcontextprotocol/sdk/server/transport.js';

  export class StdioServerTransport implements Transport {
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void>;
    receive(): Promise<JSONRPCMessage>;
  }
} 