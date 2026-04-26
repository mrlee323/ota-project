import { createClient } from "@/infrastructure/supabase/server";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import {
  showcaseContentSchema,
  type ShowcaseContent,
  type ShowcaseCreationDraft,
} from "@/domain/admin/showcaseContent";
import type { PaginatedResponse, PaginationParams } from "@/domain/admin/pagination";

function rowToContent(row: Record<string, unknown>): ShowcaseContent {
  return showcaseContentSchema.parse({
    id: row.id,
    cityName: row.city_name,
    title: row.title,
    imageUrl: row.image_url,
    hotels: row.hotels,
    serviceEnabled: row.service_enabled,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listShowcaseContents(
  params: PaginationParams,
  serviceEnabled?: boolean,
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

  if (serviceEnabled !== undefined) query = query.eq("service_enabled", serviceEnabled);

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
  draft: ShowcaseCreationDraft,
): Promise<ShowcaseContent> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("showcase_content")
    .insert({
      city_name: draft.cityName,
      title: draft.title,
      image_url: draft.imageUrl,
      hotels: draft.hotels,
      service_enabled: false,
      start_date: draft.startDate,
      end_date: draft.endDate,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`showcase 생성 실패: ${error?.message}`);

  return rowToContent(data);
}

export async function updateShowcaseContent(
  id: string,
  input: Partial<Omit<ShowcaseContent, "id" | "createdAt" | "updatedAt">>,
): Promise<ShowcaseContent> {
  const db = createServiceClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.cityName !== undefined) patch.city_name = input.cityName;
  if (input.title !== undefined) patch.title = input.title;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.hotels !== undefined) patch.hotels = input.hotels;
  if (input.serviceEnabled !== undefined) patch.service_enabled = input.serviceEnabled;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate;

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

/** 서비스 API용 — 현재 활성 컨텐츠 목록 조회 (serviceEnabled + 날짜 범위) */
export async function getActiveShowcaseContents(): Promise<ShowcaseContent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("showcase_content")
    .select("*")
    .eq("service_enabled", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`active showcase 조회 실패: ${error.message}`);

  return (data ?? []).map(rowToContent);
}
