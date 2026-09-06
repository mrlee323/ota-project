import { notFound } from "next/navigation";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { getMdPageById } from "@/infrastructure/md/mdAdminApi";
import { MdCanvas } from "@/ui/patterns/admin/md/MdCanvas";

export default async function MdCanvasPage({ params }: { params: { id: string } }) {
  await requirePermission("md", "write", "/admin");

  const row = await getMdPageById(params.id);
  if (!row) notFound();

  return (
    <div className="h-[calc(100vh-0px)]">
      <MdCanvas
        pageId={row.id}
        slug={row.slug}
        initialTitle={row.title}
        initialPage={row.page}
      />
    </div>
  );
}
