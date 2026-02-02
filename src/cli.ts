#!/usr/bin/env node
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { providerNames, validateProviders } from "./providers/index.js";
import { type ServerConfig, startServer } from "./server.js";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: "string", short: "p", default: "8787" },
    "ollama-url": { type: "string", short: "o", default: "http://localhost:11434" },
    model: { type: "string", short: "m", default: "codestral:latest" },
    providers: { type: "string", default: "" },
    daemon: { type: "boolean", short: "d", default: false },
    help: { type: "boolean", short: "h", default: false },
    version: { type: "boolean", short: "v", default: false },
  },
});

if (values.help) {
  console.log(`
2ollama - Proxy various LLM API formats to Ollama

USAGE:
  2ollama [OPTIONS]

OPTIONS:
  -p, --port <PORT>          Port to listen on (default: 8787)
  -o, --ollama-url <URL>     Ollama server URL (default: http://localhost:11434)
  -m, --model <MODEL>        Default model to use (default: codestral:latest)
      --providers <LIST>     Comma-separated providers to enable (default: all)
  -d, --daemon               Run in background
  -h, --help                 Show this help message
  -v, --version              Show version

AVAILABLE PROVIDERS:
  ${providerNames.join(", ")}

ENVIRONMENT VARIABLES:
  PORT                       Same as --port
  OLLAMA_URL                 Same as --ollama-url
  DEFAULT_MODEL              Same as --model

EXAMPLE:
  2ollama --port 8080 --model qwen2.5-coder:7b
  2ollama --providers codestral
  2ollama -d  # Run in background
`);
  process.exit(0);
}

if (values.version) {
  const pkg = await import("../package.json", { with: { type: "json" } });
  console.log(pkg.default.version);
  process.exit(0);
}

const providersArg = values.providers?.trim();
const enabledProviders = providersArg ? providersArg.split(",").map((s) => s.trim()) : undefined;

if (enabledProviders) {
  const error = validateProviders(enabledProviders);
  if (error) {
    console.error(error);
    process.exit(1);
  }
}

const config: ServerConfig = {
  port: Number.parseInt(values.port ?? "8787", 10),
  ollamaUrl: values["ollama-url"] ?? "http://localhost:11434",
  defaultModel: values.model ?? "codestral:latest",
  providers: enabledProviders,
};

if (values.daemon) {
  const args = process.argv.slice(2).filter((a) => a !== "-d" && a !== "--daemon");
  const scriptPath = process.argv[1] ?? "";
  const child = spawn(process.execPath, [scriptPath, ...args], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
  child.unref();
  console.log(`Started 2ollama in background (PID: ${child.pid})`);
  console.log(`Listening on http://localhost:${config.port}`);
  process.exit(0);
}

startServer(config);
