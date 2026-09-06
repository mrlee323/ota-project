import { NextResponse, type NextRequest } from "next/server";
import { mdPageSchema } from "@/domain/md/page";
import { resolveMdPage } from "@/infrastructure/md/resolveMdPage";

/**
 * 캔버스 미리보기용 — 저장하지 않은 페이지의 바깥 데이터를 해석한다.
 *
 * 공개 페이지는 이 라우트를 거치지 않고 `resolveMdPage` 를 직접 부른다.
 * 같은 함수를 쓰므로 미리보기와 실제 화면이 갈라지지 않는다 (FR-3.4).
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const parsed = mdPageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ resolved: {} });
  return NextResponse.json({ resolved: await resolveMdPage(parsed.data) });
}
