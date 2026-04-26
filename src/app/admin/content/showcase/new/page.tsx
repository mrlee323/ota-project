import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { ShowcaseCreationWizard } from "@/ui/patterns/admin/showcase/ShowcaseCreationWizard";

/** 쇼케이스 생성 페이지 (Server Component) */
export default async function ShowcaseNewPage() {
  // 쓰기 권한 검증 — 권한 없으면 /admin/content/showcase로 리다이렉트
  await requirePermission("showcase", "write", "/admin/content/showcase");

  return <ShowcaseCreationWizard />;
}
