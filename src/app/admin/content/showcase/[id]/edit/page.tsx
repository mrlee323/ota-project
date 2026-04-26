import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { ShowcaseEditView } from "@/ui/patterns/admin/showcase/ShowcaseEditView";

/** 쇼케이스 편집 페이지 (Server Component) */
export default async function ShowcaseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 쓰기 권한 검증 — 권한 없으면 /admin/content/showcase로 리다이렉트
  await requirePermission("showcase", "write", "/admin/content/showcase");

  return <ShowcaseEditView id={id} />;
}
