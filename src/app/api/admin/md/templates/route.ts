import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { SYSTEM_TEMPLATES, orderTemplates, templateBlockSchema } from "@/domain/md/template";
import {
  listUserTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  listFavoriteIds,
} from "@/infrastructure/md/mdTemplateApi";

/**
 * 고를 수 있는 템플릿 전부 — 시스템 4종(코드) + 내가 저장한 것(DB).
 * 즐겨찾기가 위로 온 순서로 내려간다 (FR-9.4).
 */
export async function GET() {
  const { userId } = await requirePermission("md", "read", "/admin");

  try {
    const [user, favoriteIds] = await Promise.all([
      listUserTemplates(userId),
      listFavoriteIds(userId),
    ]);
    return NextResponse.json({ items: orderTemplates(SYSTEM_TEMPLATES, user, favoriteIds) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** 지금 구성을 내 템플릿으로 저장 (FR-9.3) */
export async function POST(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const parsed = z
    .object({
      name: z.string().min(1).max(60),
      description: z.string().max(200).optional(),
      blocks: z.array(templateBlockSchema).min(1),
    })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "이름과 블록이 필요합니다" }, { status: 400 });
  }

  try {
    return NextResponse.json(await saveUserTemplate(userId, parsed.data));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/**
 * 내 템플릿 삭제.
 *
 * 저장만 되고 지울 수 없으면 잘못 저장한 하나가 목록에 영구히 남는다.
 * 시스템 템플릿은 코드에 있으니 이 경로로 지워지지 않는다.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 가 필요합니다" }, { status: 400 });

  try {
    await deleteUserTemplate(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
