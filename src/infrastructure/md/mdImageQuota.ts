import "server-only";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";

/** 사용자당 하루 몇 장까지 (FR-11.5) */
export const DAILY_IMAGE_LIMIT = 20;

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
}

export async function getImageQuota(userId: string): Promise<QuotaState> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await createServiceClient()
    .from("md_image_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  const used = count ?? 0;
  return { used, limit: DAILY_IMAGE_LIMIT, remaining: Math.max(0, DAILY_IMAGE_LIMIT - used) };
}

export async function recordImageRun(run: {
  userId: string;
  pageId: string;
  blockId: string;
  prompt: string;
  url: string;
}): Promise<void> {
  try {
    await createServiceClient().from("md_image_runs").insert({
      user_id: run.userId,
      page_id: run.pageId,
      block_id: run.blockId,
      prompt: run.prompt.slice(0, 2000),
      url: run.url,
    });
  } catch {
    // 적재 실패가 생성을 무르게 하지 않는다
  }
}
