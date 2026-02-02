const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
} as const;

function timestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${colors.dim}${h}:${m}:${s}.${ms}${colors.reset}`;
}

export const log = {
  info(msg: string) {
    console.log(`${timestamp()} ${colors.cyan}INFO${colors.reset}  ${msg}`);
  },

  success(msg: string) {
    console.log(`${timestamp()} ${colors.green}OK${colors.reset}    ${msg}`);
  },

  warn(msg: string) {
    console.log(`${timestamp()} ${colors.yellow}WARN${colors.reset}  ${msg}`);
  },

  error(msg: string) {
    console.error(`${timestamp()} ${colors.red}ERROR${colors.reset} ${msg}`);
  },

  request(method: string, path: string) {
    const methodColor = method === "GET" ? colors.green : colors.blue;
    console.log(`${timestamp()} ${methodColor}${method.padEnd(4)}${colors.reset}  ${path}`);
  },

  proxy(provider: string, detail: string) {
    console.log(
      `${timestamp()} ${colors.magenta}${provider.toUpperCase()}${colors.reset}  ${detail}`,
    );
  },

  startup(lines: string[]) {
    console.log("");
    for (const line of lines) {
      console.log(`  ${line}`);
    }
    console.log("");
  },
};
