import Link from "next/link";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { listMdPages } from "@/infrastructure/md/mdAdminApi";
import { MdCreateButton } from "@/ui/patterns/admin/md/MdCreateButton";

const STATUS_LABEL = { draft: "작성 중", published: "발행됨", archived: "보관됨" } as const;

export default async function MdListPage() {
  await requirePermission("md", "read", "/admin");
  const pages = await listMdPages();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">MD 기획전</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            모듈을 조립해 기획전 페이지를 만듭니다. 개발 배포 없이 발행됩니다.
          </p>
        </div>
        <MdCreateButton />
      </div>

      {pages.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-400">
          아직 만든 기획전이 없습니다.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {pages.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/md/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{p.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">/md/{p.slug}</p>
                </div>
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {STATUS_LABEL[p.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
