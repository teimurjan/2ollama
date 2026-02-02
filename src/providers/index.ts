import type { Provider } from "../provider.js";
import { codestralProvider } from "./codestral/index.js";

const providerRegistry: Record<string, Provider> = {
  codestral: codestralProvider,
};

export const providerNames = Object.keys(providerRegistry);

export function validateProviders(names: string[]): string | null {
  for (const name of names) {
    if (!providerRegistry[name]) {
      return `Unknown provider: ${name}. Available: ${providerNames.join(", ")}`;
    }
  }
  return null;
}

export function getProviders(names?: string[]): Provider[] {
  if (!names || names.length === 0) {
    return Object.values(providerRegistry);
  }
  return names.map((name) => providerRegistry[name]).filter(Boolean) as Provider[];
}
