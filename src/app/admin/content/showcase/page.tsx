import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { ShowcaseListView } from "@/ui/patterns/admin/showcase/ShowcaseListView";

/** 쇼케이스 컨텐츠 목록 페이지 (Server Component) */
export default async function ShowcaseListPage() {
  // 읽기 권한 검증 — 권한 없으면 /admin으로 리다이렉트
  await requirePermission("showcase", "read");

  return <ShowcaseListView />;
}
