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

  // Phase 4에서 n8n으로 교체 예정
  async generateTitle(cityName: string): Promise<string> {
    return `${cityName} 인기 호텔 모음`;
  },

  async generateImage(cityName: string): Promise<string> {
    const imageMap: Record<string, string> = {
      교토: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
      제주: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&q=80",
      부산: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80",
      나트랑: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
      파리: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    };
    return (
      imageMap[cityName] ??
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80"
    );
  },

  async generateHotels(cityName: string): Promise<ShowcaseHotelCard[]> {
    return [
      {
        id: `${cityName}-gen-001`,
        name: `${cityName} 대표 호텔`,
        location: cityName,
        imageUrl:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=480&q=80",
        stars: 5,
        discountRate: 20,
        originalPrice: 300000,
        discountPrice: 240000,
        isAppDiscount: true,
        taxIncluded: true,
        badges: ["플러스딜"],
      },
    ];
  },
};
