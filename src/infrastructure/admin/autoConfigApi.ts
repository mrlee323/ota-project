import { createClient } from "@/infrastructure/supabase/server";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import {
  autoConfigSchema,
  type AutoConfig,
  type UpdateAutoConfigInput,
} from "@/domain/admin/autoConfig";

const toUtcIso = (v: unknown) =>
  v ? new Date(v as string).toISOString() : null;

function defaultNextGenDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function defaultContentStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function defaultContentEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

function rowToConfig(row: Record<string, unknown>): AutoConfig {
  return autoConfigSchema.parse({
    enabled: row.enabled,
    intervalType: row.interval_type,
    intervalValue: row.interval_value,
    nextGenerationDate: toUtcIso(row.next_generation_date) ?? defaultNextGenDate(),
    suggestedCities: row.suggested_cities ?? [],
    contentStartDate: toUtcIso(row.content_start_date) ?? defaultContentStartDate(),
    contentEndDate: toUtcIso(row.content_end_date) ?? defaultContentEndDate(),
    promoTitle: (row.promo_title as string | null) ?? "이번 달 인기 숙소",
  });
}

export async function getAutoConfig(): Promise<AutoConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("showcase_auto_config")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) throw new Error("auto config 조회 실패");

  return rowToConfig(data);
}

export async function updateAutoConfig(
  input: UpdateAutoConfigInput,
): Promise<AutoConfig> {
  const db = createServiceClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.intervalType !== undefined) patch.interval_type = input.intervalType;
  if (input.intervalValue !== undefined) patch.interval_value = input.intervalValue;
  if (input.nextGenerationDate !== undefined) patch.next_generation_date = input.nextGenerationDate;
  if (input.suggestedCities !== undefined) patch.suggested_cities = input.suggestedCities;
  if (input.contentStartDate !== undefined) patch.content_start_date = input.contentStartDate;
  if (input.contentEndDate !== undefined) patch.content_end_date = input.contentEndDate;
  if (input.promoTitle !== undefined) patch.promo_title = input.promoTitle;

  const { data, error } = await db
    .from("showcase_auto_config")
    .update(patch)
    .select()
    .single();

  if (error || !data) throw new Error(`auto config 수정 실패: ${error?.message}`);

  return rowToConfig(data);
}
