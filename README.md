# 2ollama

Proxy server that translates various LLM API formats to [Ollama](https://ollama.com).

**Use case:** Run local LLM completions with tools that only support cloud APIs (like [Zed](https://zed.dev) editor's Codestral integration).

## Supported Providers

| Provider | Endpoints | Status |
|----------|-----------|--------|
| Codestral | `/v1/fim/completions`, `/v1/models` | ✅ |
| OpenAI | `/v1/chat/completions` | 🔜 Planned |
| Anthropic | `/v1/messages` | 🔜 Planned |

## Installation

```bash
npm install -g 2ollama
```

Or run directly with npx:

```bash
npx 2ollama
```

## Usage

### Start the proxy

```bash
2ollama
```

### Options

```
-p, --port <PORT>          Port to listen on (default: 8787)
-o, --ollama-url <URL>     Ollama server URL (default: http://localhost:11434)
-m, --model <MODEL>        Default model to use (default: codestral:latest)
-d, --daemon               Run in background
-h, --help                 Show help
-v, --version              Show version
```

### Environment variables

```bash
PORT=8787
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=codestral:latest
```

### Examples

```bash
# Use a different model
2ollama --model qwen2.5-coder:7b

# Run on a different port
2ollama --port 8080

# Run in background
2ollama --daemon

# Connect to remote Ollama
2ollama --ollama-url http://192.168.1.100:11434
```

## Zed Configuration (Codestral)

1. Start the proxy: `2ollama`

2. Configure Zed's `settings.json`:

```json
{
  "language_models": {
    "codestral": {
      "api_url": "http://localhost:8787"
    }
  },
  "features": {
    "edit_prediction_provider": "codestral"
  }
}
```

3. Enter any string as the API key when prompted (it's ignored by the proxy)

## Recommended Models

Any Ollama model with FIM (fill-in-middle) support works. For instance:

- `codestral:latest` - Mistral's code model (22B, best quality)
- `qwen2.5-coder:7b` - Good balance of speed and quality
- `qwen2.5-coder:1.5b` - Fast, lower resource usage
- `deepseek-coder-v2:16b` - Strong coding performance
- `starcoder2:7b` - Solid alternative

Pull your preferred model:

```bash
ollama pull qwen2.5-coder:7b
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Health check |
| `/v1/fim/completions` | POST | FIM completions (Codestral format) |
| `/v1/models` | GET | List available models |

## Programmatic Usage

```typescript
import { startServer } from "2ollama";

startServer({
  port: 8787,
  ollamaUrl: "http://localhost:11434",
  defaultModel: "codestral:latest",
});
```

## Architecture

2ollama uses a pluggable provider system. Each provider defines routes that translate incoming API requests to Ollama's format.

```
src/
  provider.ts           # Provider interface
  providers/
    index.ts            # Provider registry
    codestral/          # Codestral provider
      index.ts          # Route handlers
      types.ts          # Request/Response types
      transform.ts      # Format transformations
```

### Adding a Provider

```typescript
import type { Provider } from "2ollama";

export const myProvider: Provider = {
  name: "my-provider",
  routes: [
    {
      method: "POST",
      path: "/v1/my/endpoint",
      handler: async (req, res, ctx) => {
        // Transform request, call Ollama, return response
      },
    },
  ],
};
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build
bun run build

# Type check
bun run typecheck

# Lint/format
bun run check
```

## License

MIT
