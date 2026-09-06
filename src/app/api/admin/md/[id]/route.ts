import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { saveMdPage } from "@/infrastructure/md/mdAdminApi";
import { mdPageSchema, validatePage } from "@/domain/md/page";
import { normalizeGroups } from "@/domain/md/group";
import { MODULE_DEFS } from "@/domain/md/modules";

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  page: mdPageSchema,
});

/**
 * 캔버스 저장.
 *
 * **클라이언트를 믿지 않는다.** 캔버스가 이미 검증하지만 서버가 다시 한다 —
 * MCP 도, L1 도 결국 같은 검증을 지나야 저장된다 (mcp.md §6, 서버가 최종 방어선).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const access = await getFeatureAccess("md");
  if (!access.canWrite) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "페이지 형식이 올바르지 않습니다" }, { status: 400 });
  }

  // 흩어진 묶음은 막지 않고 여기서 고친다 (design.md §5)
  const page = { ...parsed.data.page, blocks: normalizeGroups(parsed.data.page.blocks) };

  const issues = validatePage(page, MODULE_DEFS);
  if (issues.length > 0) {
    return NextResponse.json(
      { error: `${issues[0].message} (블록 ${issues[0].blockId})`, issues },
      { status: 422 },
    );
  }

  try {
    await saveMdPage(params.id, page, parsed.data.title);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
