import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { createMdPage } from "@/infrastructure/md/mdAdminApi";

const createSchema = z.object({
  // 공개 URL 이 되므로 모양을 강제한다
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "영문 소문자·숫자·하이픈만 쓸 수 있습니다"),
  title: z.string().min(1).max(120),
});

export async function POST(request: NextRequest) {
  const access = await getFeatureAccess("md");
  if (!access.canWrite) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }, { status: 400 });
  }

  try {
    return NextResponse.json(await createMdPage(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
