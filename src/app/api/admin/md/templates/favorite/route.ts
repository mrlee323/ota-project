import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { setFavorite } from "@/infrastructure/md/mdTemplateApi";

/**
 * 즐겨찾기 켜고 끄기 (FR-9.4).
 *
 * 개인 전용이다 (Q8) — 남에게 보이지 않고, 공유 개념이 없다.
 * templateId 는 시스템 템플릿의 코드 id('t1-brand')일 수도, 내 템플릿의 uuid 일 수도 있다.
 */
export async function POST(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const parsed = z
    .object({ templateId: z.string().min(1).max(64), on: z.boolean() })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });

  try {
    await setFavorite(userId, parsed.data.templateId, parsed.data.on);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
