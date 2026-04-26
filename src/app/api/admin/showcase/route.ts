import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import {
  listShowcaseContents,
  createShowcaseContent,
} from "@/infrastructure/admin/showcaseContentApi";
import { paginationParamsSchema } from "@/domain/admin/pagination";
import { showcaseCreationDraftSchema } from "@/domain/admin/showcaseContent";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const params = paginationParamsSchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });
  if (!params.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const serviceEnabledParam = searchParams.get("serviceEnabled");
  const serviceEnabled =
    serviceEnabledParam === "true" ? true : serviceEnabledParam === "false" ? false : undefined;

  try {
    const data = await listShowcaseContents(params.data, serviceEnabled);
    return NextResponse.json(data);
  } catch (err) {
    console.error("showcase list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = showcaseCreationDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await createShowcaseContent(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("showcase create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
