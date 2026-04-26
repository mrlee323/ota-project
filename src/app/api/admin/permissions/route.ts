import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess, getAllPermissions } from "@/infrastructure/admin/permissionsApi";
import { ADMIN_FEATURES } from "@/domain/admin/permissions";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feature = searchParams.get("feature");

  if (feature) {
    if (!ADMIN_FEATURES.includes(feature as (typeof ADMIN_FEATURES)[number])) {
      return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
    }
    const access = await getFeatureAccess(feature as (typeof ADMIN_FEATURES)[number]);
    return NextResponse.json(access);
  }

  const permissions = await getAllPermissions();
  return NextResponse.json(permissions);
}
