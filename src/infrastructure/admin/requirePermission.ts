import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "./permissionsApi";
import type { AdminFeature } from "@/domain/admin/permissions";

type PermissionMode = "read" | "write";

export async function requirePermission(
  feature: AdminFeature,
  mode: PermissionMode = "read",
  redirectTo = "/admin",
): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const access = await getFeatureAccess(feature);
  const hasAccess = mode === "read" ? access.canRead : access.canWrite;

  if (!hasAccess) redirect(redirectTo);

  return { userId: user.id };
}
