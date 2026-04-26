import { createClient } from "@/infrastructure/supabase/server";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import {
  autoConfigSchema,
  type AutoConfig,
  type UpdateAutoConfigInput,
} from "@/domain/admin/autoConfig";

function rowToConfig(row: Record<string, unknown>): AutoConfig {
  return autoConfigSchema.parse({
    feature: row.feature,
    enabled: row.enabled,
    cronExpression: row.cron_expression,
    lastRunAt: row.last_run_at ?? null,
    nextRunAt: row.next_run_at ?? null,
  });
}

export async function getAutoConfig(): Promise<AutoConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("showcase_auto_config")
    .select("*")
    .eq("feature", "showcase")
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
  if (input.cronExpression !== undefined) patch.cron_expression = input.cronExpression;

  const { data, error } = await db
    .from("showcase_auto_config")
    .update(patch)
    .eq("feature", "showcase")
    .select()
    .single();

  if (error || !data) throw new Error(`auto config 수정 실패: ${error?.message}`);

  return rowToConfig(data);
}
