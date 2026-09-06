import "server-only";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";

export interface AiRun {
  request: string;
  template: string;
  attempt: number;
  ok: boolean;
  error?: string;
}

/**
 * 통과율 적재 (AC-4).
 *
 * 1차와 재요청을 **나눠서** 쌓는다. 합쳐 놓으면 «프롬프트가 좋아졌는지» 를 알 수 없다.
 * 실패 사유 분포가 어디를 고칠지 알려주는 유일한 근거다.
 */
export async function recordAiRun(run: AiRun): Promise<void> {
  try {
    await createServiceClient().from("md_ai_runs").insert({
      request: run.request.slice(0, 500),
      template: run.template,
      attempt: run.attempt,
      ok: run.ok,
      error: run.error?.slice(0, 500) ?? null,
    });
  } catch {
    // 측정이 생성을 막으면 안 된다
  }
}

export interface AiStats {
  total: number;
  firstPass: number;
  finalPass: number;
  topErrors: { error: string; count: number }[];
}

export async function getAiStats(): Promise<AiStats> {
  const { data } = await createServiceClient()
    .from("md_ai_runs")
    .select("request, attempt, ok, error")
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = (data ?? []) as { request: string; attempt: number; ok: boolean; error: string | null }[];
  if (rows.length === 0) return { total: 0, firstPass: 0, finalPass: 0, topErrors: [] };

  // 요청 하나에 시도가 여러 번이다. «요청» 단위로 접는다
  const byRequest = new Map<string, { first: boolean; any: boolean }>();
  for (const r of rows) {
    const cur = byRequest.get(r.request) ?? { first: false, any: false };
    if (r.ok && r.attempt === 1) cur.first = true;
    if (r.ok) cur.any = true;
    byRequest.set(r.request, cur);
  }

  const counts: Record<string, number> = {};
  for (const r of rows) {
    if (r.ok || !r.error) continue;
    const key = r.error.split(":")[0].slice(0, 60);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return {
    total: byRequest.size,
    firstPass: [...byRequest.values()].filter((v) => v.first).length,
    finalPass: [...byRequest.values()].filter((v) => v.any).length,
    topErrors: Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count })),
  };
}
