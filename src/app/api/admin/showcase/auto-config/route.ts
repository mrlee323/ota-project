import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { getAutoConfig, updateAutoConfig } from "@/infrastructure/admin/autoConfigApi";
import { updateAutoConfigSchema } from "@/domain/admin/autoConfig";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const config = await getAutoConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error("auto-config get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = updateAutoConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateAutoConfig(parsed.data);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("auto-config update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
