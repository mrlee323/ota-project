import "server-only";
import { createPublicClient } from "@/infrastructure/supabase/publicClient";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";

export interface MdEvent {
  pageId: string;
  blockId?: string | null;
  moduleType?: string | null;
  event: "view" | "click";
}

/**
 * 적재 — 공개 페이지에서 익명으로 들어온다.
 *
 * 실패해도 조용히 넘어간다. 측정이 페이지를 깨뜨리면 안 된다.
 */
export async function recordMdEvent(e: MdEvent): Promise<void> {
  try {
    await createPublicClient().from("md_page_events").insert({
      page_id: e.pageId,
      block_id: e.blockId ?? null,
      module_type: e.moduleType ?? null,
      event: e.event,
    });
  } catch {
    // 무시
  }
}

export interface MdPageStats {
  views: number;
  clicks: number;
}

/** 목록 화면용 — 페이지 수만큼 쿼리를 돌지 않게 한 번에 가져온다 */
export async function getMdStats(pageIds: string[]): Promise<Record<string, MdPageStats>> {
  if (pageIds.length === 0) return {};

  const { data, error } = await createServiceClient()
    .from("md_page_stats")
    .select("page_id, views, clicks")
    .in("page_id", pageIds);

  if (error || !data) return {};

  return Object.fromEntries(
    data.map((r) => {
      const row = r as { page_id: string; views: number | null; clicks: number | null };
      return [row.page_id, { views: Number(row.views ?? 0), clicks: Number(row.clicks ?? 0) }];
    }),
  );
}

/** 모듈 «종류별» 클릭 — 어떤 모듈이 실제로 일하는지 (FR-8.4) */
export async function getModuleClicks(): Promise<Record<string, number>> {
  const { data, error } = await createServiceClient()
    .from("md_page_events")
    .select("module_type")
    .eq("event", "click")
    .not("module_type", "is", null)
    .limit(5000);

  if (error || !data) return {};

  const out: Record<string, number> = {};
  for (const r of data as { module_type: string }[]) {
    out[r.module_type] = (out[r.module_type] ?? 0) + 1;
  }
  return out;
}
