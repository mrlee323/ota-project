import type { ShowcaseContent, ShowcaseCreationDraft } from "@/domain/admin/showcaseContent";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import type { ShowcaseService } from "./mockShowcaseService";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const showcaseService: ShowcaseService = {
  async getShowcaseList(): Promise<ShowcaseContent[]> {
    const data = await apiFetch<{ items: ShowcaseContent[] }>(
      "/api/admin/showcase?limit=100&page=1",
    );
    return data.items;
  },

  async getActiveShowcaseList(): Promise<ShowcaseContent[]> {
    const data = await apiFetch<{ items: ShowcaseContent[] }>(
      "/api/admin/showcase?limit=100&page=1&serviceEnabled=true",
    );
    return data.items;
  },

  async getShowcaseById(id: string): Promise<ShowcaseContent | null> {
    try {
      return await apiFetch<ShowcaseContent>(`/api/admin/showcase/${id}`);
    } catch {
      return null;
    }
  },

  async createShowcase(draft: ShowcaseCreationDraft): Promise<ShowcaseContent> {
    return apiFetch<ShowcaseContent>("/api/admin/showcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
  },

  async updateShowcase(id: string, data: Partial<ShowcaseContent>): Promise<ShowcaseContent> {
    return apiFetch<ShowcaseContent>(`/api/admin/showcase/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async toggleServiceEnabled(id: string, enabled: boolean): Promise<ShowcaseContent> {
    return apiFetch<ShowcaseContent>(`/api/admin/showcase/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceEnabled: enabled }),
    });
  },

  async generateTitle(cityName: string, prompt?: string): Promise<string> {
    const data = await apiFetch<{ title: string }>("/api/upload/title/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName, prompt }),
    });
    return data.title;
  },

  async generateImage(cityName: string, title?: string, prompt?: string): Promise<string> {
    const data = await apiFetch<{ url: string }>("/api/upload/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName, title, prompt, folder: "showcase" }),
    });
    return data.url;
  },

  async generateHotels(cityName: string, title?: string, prompt?: string): Promise<ShowcaseHotelCard[]> {
    const data = await apiFetch<{ hotels: ShowcaseHotelCard[] }>("/api/admin/showcase/hotels/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName, title, prompt }),
    });
    return data.hotels;
  },
};
