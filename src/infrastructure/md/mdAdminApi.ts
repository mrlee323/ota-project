import "server-only";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import { mdPageSchema, emptyMdPage, type MdPage } from "@/domain/md/page";

export interface MdPageSummary {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
}

export interface MdPageDetail extends MdPageSummary {
  page: MdPage;
  startsAt: string | null;
  endsAt: string | null;
}

function toSummary(r: Record<string, unknown>): MdPageSummary {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    status: r.status as MdPageSummary["status"],
    updatedAt: String(r.updated_at),
  };
}

export async function listMdPages(): Promise<MdPageSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("md_pages")
    .select("id, slug, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`MD 목록 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => toSummary(r as Record<string, unknown>));
}

export async function getMdPageById(id: string): Promise<MdPageDetail | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("md_pages").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const r = data as Record<string, unknown>;
  return {
    ...toSummary(r),
    page: mdPageSchema.parse(r.page),
    startsAt: (r.starts_at as string | null) ?? null,
    endsAt: (r.ends_at as string | null) ?? null,
  };
}

export async function createMdPage(input: {
  slug: string;
  title: string;
  page?: MdPage;
}): Promise<{ id: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("md_pages")
    // 항상 draft 로 만든다. 발행은 사람이 별도로 한다 (FR-5.6)
    .insert({ slug: input.slug, title: input.title, page: input.page ?? emptyMdPage(), status: "draft" })
    .select("id")
    .single();

  if (error) throw new Error(`MD 생성 실패: ${error.message}`);
  return { id: String((data as { id: string }).id) };
}

/**
 * 캔버스 저장.
 *
 * **검증을 통과한 것만 저장한다** (FR-2.5). 캔버스든 MCP 든 L1 이든
 * 같은 `validatePage` 를 지나야 한다 — 서버가 최종 방어선이다.
 */
export async function saveMdPage(id: string, page: MdPage, title?: string): Promise<void> {
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { page };
  if (title) patch.title = title;

  const { error } = await supabase.from("md_pages").update(patch).eq("id", id);
  if (error) throw new Error(`MD 저장 실패: ${error.message}`);
}
