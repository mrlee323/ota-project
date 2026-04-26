import { createClient } from "@/infrastructure/supabase/server";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import {
  showcaseContentSchema,
  type ShowcaseContent,
  type CreateShowcaseInput,
  type UpdateShowcaseInput,
} from "@/domain/admin/showcaseContent";
import type { PaginatedResponse, PaginationParams } from "@/domain/admin/pagination";

/** DB 행을 도메인 타입으로 변환 */
function rowToContent(row: Record<string, unknown>): ShowcaseContent {
  return showcaseContentSchema.parse({
    id: row.id,
    promoTitle: row.promo_title,
    regions: row.regions,
    status: row.status,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listShowcaseContents(
  params: PaginationParams,
  status?: string,
): Promise<PaginatedResponse<ShowcaseContent>> {
  const supabase = await createClient();
  const { page, limit } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("showcase_content")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) throw new Error(`showcase 목록 조회 실패: ${error.message}`);

  const total = count ?? 0;
  return {
    items: (data ?? []).map(rowToContent),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getShowcaseContent(id: string): Promise<ShowcaseContent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("showcase_content")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("showcase 컨텐츠를 찾을 수 없습니다");

  return rowToContent(data);
}

export async function createShowcaseContent(
  input: CreateShowcaseInput,
  createdBy: string,
): Promise<ShowcaseContent> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("showcase_content")
    .insert({
      promo_title: input.promoTitle,
      regions: input.regions,
      status: input.status ?? "draft",
      created_by: createdBy,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`showcase 생성 실패: ${error?.message}`);

  return rowToContent(data);
}

export async function updateShowcaseContent(
  id: string,
  input: UpdateShowcaseInput,
): Promise<ShowcaseContent> {
  const db = createServiceClient();

  const patch: Record<string, unknown> = {};
  if (input.promoTitle !== undefined) patch.promo_title = input.promoTitle;
  if (input.regions !== undefined) patch.regions = input.regions;
  if (input.status !== undefined) patch.status = input.status;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from("showcase_content")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(`showcase 수정 실패: ${error?.message}`);

  return rowToContent(data);
}

export async function deleteShowcaseContent(id: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("showcase_content").delete().eq("id", id);
  if (error) throw new Error(`showcase 삭제 실패: ${error.message}`);
}

/** 서비스 API용 — active 컨텐츠 1개 조회 (최신순) */
export async function getActiveShowcaseContent(): Promise<ShowcaseContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("showcase_content")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`active showcase 조회 실패: ${error.message}`);
  if (!data) return null;

  return rowToContent(data);
}
