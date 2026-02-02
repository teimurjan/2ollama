import type { IncomingMessage, ServerResponse } from "node:http";

export interface ProviderContext {
  ollamaUrl: string;
  defaultModel: string;
  sendJson: (res: ServerResponse, status: number, data: unknown) => void;
  readBody: (req: IncomingMessage) => Promise<string>;
  generateId: () => string;
}

export interface RouteHandler {
  method: "GET" | "POST";
  path: string;
  handler: (req: IncomingMessage, res: ServerResponse, ctx: ProviderContext) => Promise<void>;
}

export interface Provider {
  name: string;
  routes: RouteHandler[];
}
