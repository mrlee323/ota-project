import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { ShowcaseCreationView } from "@/ui/patterns/admin/showcase/ShowcaseCreationView";

/** 쇼케이스 생성 페이지 (Server Component) */
export default async function ShowcaseNewPage() {
  await requirePermission("showcase", "write", "/admin/content/showcase");

  return <ShowcaseCreationView />;
}
