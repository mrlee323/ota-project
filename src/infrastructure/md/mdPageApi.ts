import "server-only";
import { createPublicClient } from "@/infrastructure/supabase/publicClient";
import { mdPageSchema, type MdPage } from "@/domain/md/page";

/** md_pages 한 행 — 서비스가 쓰는 모양 */
export interface MdPageRow {
  id: string;
  slug: string;
  title: string;
  page: MdPage;
  status: "draft" | "published" | "archived";
  startsAt: string | null;
  endsAt: string | null;
}

function rowToPage(row: Record<string, unknown>): MdPageRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    // 저장된 JSON 이 스키마와 다르면 여기서 걸린다 — 화면까지 흘려보내지 않는다
    page: mdPageSchema.parse(row.page),
    status: row.status as MdPageRow["status"],
    startsAt: (row.starts_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
  };
}

/**
 * 공개 페이지 조회.
 *
 * 발행 상태와 노출 기간을 **함께** 본다 — 기간이 지난 MD 는 404 다 (FR-4.3).
 * 기간을 캐시 태그에 넣지 않는 이유가 이것이다: 시간이 지나면 저절로 사라져야 한다.
 */
export async function getPublishedMdPage(slug: string): Promise<MdPageRow | null> {
  // 쿠키를 읽지 않는 클라이언트를 쓴다 — 쿠키를 건드리면 Next 가 이 페이지를
  // 무조건 동적으로 판정해 ISR 이 죽는다 (design.md §6).
  const supabase = createPublicClient();

  // ISR 아래에서는 이 "now" 가 «마지막 재생성 시점» 이다.
  // 노출 기간이 끝난 직후 최대 revalidate 간격만큼 페이지가 남을 수 있다 —
  // 기획전에는 허용 가능한 오차다. 즉시 내려야 하면 발행 취소로 revalidate 를 건다.
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("md_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .maybeSingle();

  if (error || !data) return null;
  return rowToPage(data as Record<string, unknown>);
}
