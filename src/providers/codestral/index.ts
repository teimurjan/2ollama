import type { IncomingMessage, ServerResponse } from "node:http";
import { log } from "../../log.js";
import type { Provider, ProviderContext } from "../../provider.js";
import { parseNDJSON, transformRequest, transformResponse } from "./transform.js";
import type { CodestralRequest, OllamaResponse } from "./types.js";

async function handleModels(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: ProviderContext,
): Promise<void> {
  ctx.sendJson(res, 200, {
    object: "list",
    data: [
      {
        id: ctx.defaultModel,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "ollama",
      },
    ],
  });
}

async function handleFimCompletions(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: ProviderContext,
): Promise<void> {
  try {
    const body = await ctx.readBody(req);
    const codestralReq: CodestralRequest = JSON.parse(body);
    const ollamaReq = transformRequest(codestralReq, ctx.defaultModel);

    log.proxy("fim", `model=${ollamaReq.model} stream=${ollamaReq.stream}`);

    const ollamaRes = await fetch(`${ctx.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaReq),
    });

    if (!ollamaRes.ok) {
      const error = await ollamaRes.text();
      log.error(`Ollama ${ollamaRes.status}: ${error}`);
      ctx.sendJson(res, ollamaRes.status, {
        error: { message: error, type: "ollama_error" },
      });
      return;
    }

    if (ollamaReq.stream) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      for await (const chunk of parseNDJSON(ollamaRes, ollamaReq.model, ctx.generateId)) {
        res.write(chunk);
      }
      res.end();
      return;
    }

    const ollamaData = (await ollamaRes.json()) as OllamaResponse;
    const codestralRes = transformResponse(ollamaData, ollamaReq.model, ctx.generateId);
    ctx.sendJson(res, 200, codestralRes);
  } catch (error) {
    log.error(String(error));
    ctx.sendJson(res, 500, {
      error: { message: String(error), type: "proxy_error" },
    });
  }
}

export const codestralProvider: Provider = {
  name: "codestral",
  routes: [
    { method: "GET", path: "/v1/models", handler: handleModels },
    {
      method: "POST",
      path: "/v1/fim/completions",
      handler: handleFimCompletions,
    },
  ],
};
