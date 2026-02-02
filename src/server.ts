import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ProviderContext, RouteHandler } from "./provider.js";
import { getProviders } from "./providers/index.js";

export interface ServerConfig {
  port: number;
  ollamaUrl: string;
  defaultModel: string;
  providers?: string[];
}

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function startServer(config: ServerConfig): void {
  const { port, ollamaUrl, defaultModel } = config;

  const providers = getProviders(config.providers);

  const enabledNames = providers.map((p) => p.name);

  const ctx: ProviderContext = {
    ollamaUrl,
    defaultModel,
    sendJson,
    readBody,
    generateId,
  };

  const routeMap = new Map<string, RouteHandler>();
  for (const provider of providers) {
    for (const route of provider.routes) {
      const key = `${route.method}:${route.path}`;
      routeMap.set(key, route);
    }
  }

  const server = createServer(async (req, res) => {
    setCorsHeaders(res);

    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const path = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`[${req.method}] ${path}`);

    if (path === "/" || path === "/health") {
      sendJson(res, 200, { status: "ok", ollama: ollamaUrl, providers: enabledNames });
      return;
    }

    const routeKey = `${req.method}:${path}`;
    const route = routeMap.get(routeKey);

    if (route) {
      await route.handler(req, res, ctx);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  });

  server.listen(port, () => {
    console.log(`🚀 2ollama proxy running on http://localhost:${port}`);
    console.log(`   Proxying to Ollama at ${ollamaUrl}`);
    console.log(`   Default model: ${defaultModel}`);
    console.log(`   Providers: ${enabledNames.join(", ")}`);
  });
}
