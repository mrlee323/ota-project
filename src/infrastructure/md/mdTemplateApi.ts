import "server-only";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import { templateSchema, type Template, type TemplateBlock } from "@/domain/md/template";

// ─── 사용자 템플릿 · 즐겨찾기 (FR-9.3 · FR-9.4) ─────────────────────────────
//
// 시스템 템플릿 4종은 DB 에 없다 — 코드(domain/md/template.ts)가 원본이다.
// 여기서 다루는 건 담당자가 자기 구성을 저장한 것뿐이다.
//
// 서비스 클라이언트는 RLS 를 지나치므로 **모든 함수가 userId 를 받아 직접 거른다.**
// 남의 템플릿이 보이거나 지워지는 길을 만들지 않는다.

function toTemplate(r: Record<string, unknown>): Template {
  return templateSchema.parse({
    id: String(r.id),
    name: String(r.name),
    description: String(r.description ?? ""),
    blocks: r.blocks,
    kind: "user",
    visibility: (r.visibility as string) ?? "private",
    ownerId: String(r.owner_id),
  });
}

export async function listUserTemplates(userId: string): Promise<Template[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("md_templates")
    .select("id, name, description, blocks, visibility, owner_id")
    .eq("kind", "user")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`템플릿 목록 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => toTemplate(r as Record<string, unknown>));
}

export async function saveUserTemplate(
  userId: string,
  input: { name: string; description?: string; blocks: TemplateBlock[] },
): Promise<Template> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("md_templates")
    .insert({
      name: input.name,
      description: input.description ?? "",
      blocks: input.blocks,
      kind: "user",
      visibility: "private",
      owner_id: userId,
    })
    .select("id, name, description, blocks, visibility, owner_id")
    .single();

  if (error) throw new Error(`템플릿 저장 실패: ${error.message}`);
  return toTemplate(data as Record<string, unknown>);
}

export async function deleteUserTemplate(userId: string, id: string): Promise<void> {
  const supabase = createServiceClient();
  // owner_id 로 함께 거른다 — 남의 것은 지워지지 않는다
  const { error } = await supabase
    .from("md_templates")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);

  if (error) throw new Error(`템플릿 삭제 실패: ${error.message}`);

  // FK 를 버렸으므로 즐겨찾기는 같이 지운다 (마이그레이션 주석 참고)
  await supabase.from("md_template_favorites").delete().eq("template_id", id);
}

export async function listFavoriteIds(userId: string): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("md_template_favorites")
    .select("template_id")
    .eq("user_id", userId);

  if (error) throw new Error(`즐겨찾기 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => String((r as Record<string, unknown>).template_id));
}

export async function setFavorite(userId: string, templateId: string, on: boolean): Promise<void> {
  const supabase = createServiceClient();

  const { error } = on
    ? await supabase
        .from("md_template_favorites")
        .upsert({ user_id: userId, template_id: templateId }, { onConflict: "user_id,template_id" })
    : await supabase
        .from("md_template_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("template_id", templateId);

  if (error) throw new Error(`즐겨찾기 변경 실패: ${error.message}`);
}
