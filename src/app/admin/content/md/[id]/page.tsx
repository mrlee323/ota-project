import { notFound } from "next/navigation";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { getMdPageById } from "@/infrastructure/md/mdAdminApi";
import { MdCanvas } from "@/ui/patterns/admin/md/MdCanvas";

export default async function MdCanvasPage({ params }: { params: { id: string } }) {
  await requirePermission("md", "write", "/admin");

  const row = await getMdPageById(params.id);
  if (!row) notFound();

  return (
    // 어드민 레이아웃의 p-8 을 상쇄해 캔버스가 화면을 꽉 쓰게 한다.
    // 미리보기가 절반을 차지하므로 세로 공간이 곧 사용성이다.
    <div className="-m-8 h-[calc(100vh-0px)] overflow-hidden border-t border-gray-200">
      <MdCanvas
        pageId={row.id}
        slug={row.slug}
        initialTitle={row.title}
        initialPage={row.page}
        status={row.status}
        startsAt={row.startsAt}
        endsAt={row.endsAt}
      />
    </div>
  );
}
