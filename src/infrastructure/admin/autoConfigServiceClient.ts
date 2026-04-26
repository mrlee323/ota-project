import type { AutoConfig, UpdateAutoConfigInput } from "@/domain/admin/autoConfig";
import type { AutoConfigService } from "./mockAutoConfigService";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const autoConfigService: AutoConfigService = {
  async getAutoConfig(): Promise<AutoConfig> {
    return apiFetch<AutoConfig>("/api/admin/showcase/auto-config");
  },

  async updateAutoConfig(input: UpdateAutoConfigInput): Promise<AutoConfig> {
    return apiFetch<AutoConfig>("/api/admin/showcase/auto-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },
};
