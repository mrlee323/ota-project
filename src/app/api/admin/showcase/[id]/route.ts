import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import {
  getShowcaseContent,
  updateShowcaseContent,
  deleteShowcaseContent,
} from "@/infrastructure/admin/showcaseContentApi";
import { updateShowcaseSchema } from "@/domain/admin/showcaseContent";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await getShowcaseContent(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = updateShowcaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateShowcaseContent(id, parsed.data);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("showcase update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await deleteShowcaseContent(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("showcase delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
