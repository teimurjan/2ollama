import type {
  CodestralFimChunk,
  CodestralFimResponse,
  CodestralRequest,
  OllamaRequest,
  OllamaResponse,
} from "./types.js";

export function transformRequest(codestral: CodestralRequest, defaultModel: string): OllamaRequest {
  const options: OllamaRequest["options"] = {};

  if (codestral.temperature !== undefined) {
    options.temperature = codestral.temperature;
  }
  if (codestral.top_p !== undefined) {
    options.top_p = codestral.top_p;
  }
  if (codestral.max_tokens !== undefined) {
    options.num_predict = codestral.max_tokens;
  }
  if (codestral.stop !== undefined) {
    options.stop = Array.isArray(codestral.stop) ? codestral.stop : [codestral.stop];
  }
  if (codestral.random_seed !== undefined) {
    options.seed = codestral.random_seed;
  }

  return {
    model: codestral.model || defaultModel,
    prompt: codestral.prompt,
    suffix: codestral.suffix,
    stream: codestral.stream ?? false,
    options,
  };
}

export function transformResponse(
  ollama: OllamaResponse,
  model: string,
  generateId: () => string,
): CodestralFimResponse {
  return {
    id: generateId(),
    object: "text_completion",
    model,
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        text: ollama.response,
        finish_reason: ollama.done_reason || "stop",
      },
    ],
    usage: {
      prompt_tokens: ollama.prompt_eval_count || 0,
      completion_tokens: ollama.eval_count || 0,
      total_tokens: (ollama.prompt_eval_count || 0) + (ollama.eval_count || 0),
    },
  };
}

export async function* parseNDJSON(
  response: Response,
  model: string,
  generateId: () => string,
): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const ollama: OllamaResponse = JSON.parse(line);
        const chunk: CodestralFimChunk = {
          id: generateId(),
          object: "text_completion",
          model,
          created: Math.floor(Date.now() / 1000),
          choices: [
            {
              index: 0,
              text: ollama.response,
              finish_reason: ollama.done ? ollama.done_reason || "stop" : null,
            },
          ],
        };
        yield `data: ${JSON.stringify(chunk)}\n\n`;

        if (ollama.done) {
          yield "data: [DONE]\n\n";
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }
}
