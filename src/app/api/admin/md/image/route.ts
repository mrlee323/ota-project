import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { mdPageSchema } from "@/domain/md/page";
import { generateModuleImage } from "@/infrastructure/md/mdImageService";
import { getImageQuota, recordImageRun } from "@/infrastructure/md/mdImageQuota";

const schema = z.object({
  pageId: z.string().uuid(),
  pageTitle: z.string().min(1).max(200),
  blockId: z.string().min(1).max(64),
  page: mdPageSchema,
  intent: z.string().max(300).optional(),
});

/**
 * 캔버스 전용 이미지 생성 (FR-11).
 *
 * 결과를 블록에 자동으로 꽂지 않는다 — URL 만 돌려주고 담당자가 보고 고른다.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { userId } = await requirePermission("md", "write", "/admin");

  const quota = await getImageQuota(userId);
  if (quota.remaining <= 0) {
    return NextResponse.json(
      { error: `오늘 생성 한도(${quota.limit}장)를 다 썼습니다. 이미지를 직접 올려 주세요.`, quota },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "요청이 올바르지 않습니다" }, { status: 400 });

  try {
    const img = await generateModuleImage(parsed.data);
    await recordImageRun({
      userId,
      pageId: parsed.data.pageId,
      blockId: parsed.data.blockId,
      prompt: img.prompt,
      url: img.url,
    });
    return NextResponse.json({ ...img, quota: await getImageQuota(userId) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
