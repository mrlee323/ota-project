import { notFound } from "next/navigation";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { getMdPageBySlug } from "@/infrastructure/md/mdAdminApi";
import { MdPageView } from "@/ui/patterns/md/MdPageView";

/**
 * 발행 전 미리보기.
 *
 * 라우트만 갈렸을 뿐 **화면은 공개 페이지와 같은 컴포넌트**다 (MdPageView).
 * 갈린 이유는 캐시 정책이다 — 공개 페이지는 ISR 이라 쿠키(=세션)를 못 읽고,
 * 미리보기는 «누가 보는지» 를 알아야 하므로 세션이 필요하다.
 */
export const dynamic = "force-dynamic";

export default async function MdPreviewPage({ params }: { params: { slug: string } }) {
  // 발행 전 내용이라 아무나 보면 안 된다
  await requirePermission("md", "read", "/admin");

  const row = await getMdPageBySlug(params.slug);
  if (!row) notFound();

  return <MdPageView pageId={row.id} page={row.page} preview />;
}
