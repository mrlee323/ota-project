import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { issueMcpToken, revokeMcpToken } from "@/infrastructure/mcp/auth";

/** 발급 — 원문은 이 응답에서만 볼 수 있다 */
export async function POST(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const parsed = z
    .object({ label: z.string().min(1).max(60) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "이름을 입력하세요" }, { status: 400 });

  try {
    return NextResponse.json(await issueMcpToken(userId, parsed.data.label));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 가 필요합니다" }, { status: 400 });

  try {
    // 남의 토큰은 끊을 수 없다 — userId 로 함께 거른다
    await revokeMcpToken(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
