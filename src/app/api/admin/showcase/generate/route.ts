import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { inngest } from "@/infrastructure/inngest/client";
import { z } from "zod";

const generateRequestSchema = z.object({
  cities: z.array(z.string().min(1)).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prompt: z.string().optional(),
});

/**
 * POST /api/admin/showcase/generate
 * 어드민 UI의 "지금 생성" 버튼 → Inngest 배치 이벤트를 즉시 발송한다.
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
  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { cities, startDate, endDate, prompt } = parsed.data;

  try {
    const { ids } = await inngest.send({
      name: "admin/showcase.generate-batch",
      data: { cities, startDate, endDate, prompt, triggeredBy: "manual" },
    });

    return NextResponse.json({ ok: true, eventIds: ids });
  } catch (err) {
    console.error("[showcase/generate] inngest.send failed:", err);
    return NextResponse.json({ error: "Failed to trigger generation" }, { status: 500 });
  }
}
