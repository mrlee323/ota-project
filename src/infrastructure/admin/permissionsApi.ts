import { createClient } from "@/infrastructure/supabase/server";
import type { AdminFeature, FeatureAccess } from "@/domain/admin/permissions";

export async function getFeatureAccess(feature: AdminFeature): Promise<FeatureAccess> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { canRead: false, canWrite: false };

    const { data, error } = await supabase
      .from("admin_permissions")
      .select("can_read, can_write")
      .eq("user_id", user.id)
      .eq("feature", feature)
      .single();

    if (error || !data) return { canRead: false, canWrite: false };

    return { canRead: data.can_read, canWrite: data.can_write };
  } catch {
    return { canRead: false, canWrite: false };
  }
}

export async function getAllPermissions(): Promise<
  Array<{ feature: AdminFeature; canRead: boolean; canWrite: boolean }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("admin_permissions")
      .select("feature, can_read, can_write")
      .eq("user_id", user.id);

    if (error || !data) return [];

    return data.map((row) => ({
      feature: row.feature as AdminFeature,
      canRead: row.can_read,
      canWrite: row.can_write,
    }));
  } catch {
    return [];
  }
}
