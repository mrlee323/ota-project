import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { inngest } from "@/infrastructure/inngest/client";
import { z } from "zod";

const schema = z.object({
  cityName: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  prompt: z.string().optional(),
});

/**
 * POST /api/admin/showcase/regenerate-city
 * 단일 도시의 쇼케이스 콘텐츠를 Inngest 백그라운드 작업으로 재생성한다.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFeatureAccess("showcase");
  if (!access.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { cityName, startDate, endDate, prompt } = parsed.data;

  try {
    const { ids } = await inngest.send({
      name: "admin/showcase.regenerate-city",
      data: { cityName, startDate, endDate, prompt },
    });

    return NextResponse.json({ ok: true, eventIds: ids });
  } catch (err) {
    console.error("[showcase/regenerate-city] inngest.send failed:", err);
    return NextResponse.json({ error: "Failed to trigger regeneration" }, { status: 500 });
  }
}
