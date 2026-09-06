import { redirect } from "next/navigation";
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";

/**
 * 발행 전 미리보기 — Next Draft Mode 를 켜고 **같은 공개 경로**로 보낸다.
 *
 * 별도 미리보기 라우트를 만들지 않는다 (design.md §6).
 * 만드는 순간 «미리보기에선 됐는데 발행하니 다르다» 가 생긴다.
 */
export async function GET(request: NextRequest) {
  // 발행 전 내용이라 아무나 보면 안 된다
  const access = await getFeatureAccess("md");
  if (!access.canRead) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug 가 필요합니다" }, { status: 400 });

  (await draftMode()).enable();
  redirect(`/md/${slug}`);
}
