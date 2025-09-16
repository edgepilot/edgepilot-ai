import type { ChatRequest } from "./types";
import { HttpError } from "./types";

export interface ProviderDriver {
  name: string;
  fetchStream(req: ChatRequest, signal?: AbortSignal): Promise<Response>;
}

const registry = new Map<string, ProviderDriver>();

export function registerDriver(driver: ProviderDriver) {
  registry.set(driver.name, driver);
}

export function getDriver(name: string): ProviderDriver {
  const d = registry.get(name);
  if (!d) throw new HttpError(404, 'Provider not found', `Provider "${name}" not registered`);
  return d;
}