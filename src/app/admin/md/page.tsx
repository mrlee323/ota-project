import Link from "next/link";
import { requirePermission } from "@/infrastructure/admin/requirePermission";
import { listMdPages } from "@/infrastructure/md/mdAdminApi";
import { getMdStats, getModuleClicks } from "@/infrastructure/md/mdEventApi";
import { STATUS_LABEL, visibilityNote } from "@/domain/md/status";
import { findModuleDef } from "@/domain/md/modules";
import { MdCreateButton } from "@/ui/patterns/admin/md/MdCreateButton";

export default async function MdListPage() {
  await requirePermission("md", "read", "/admin");

  const pages = await listMdPages();
  const [stats, moduleClicks] = await Promise.all([
    getMdStats(pages.map((p) => p.id)),
    getModuleClicks(),
  ]);

  const ranked = Object.entries(moduleClicks).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">MD 기획전</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            모듈을 조립해 기획전 페이지를 만듭니다. 개발 배포 없이 발행됩니다.
          </p>
        </div>
        <MdCreateButton />
      </div>

      {/* 어떤 모듈이 실제로 일하는지 (FR-8.4) — 모듈을 늘릴지 줄일지 판단할 근거다 */}
      {ranked.length > 0 ? (
        <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">모듈별 클릭</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ranked.map(([type, count]) => (
              <span key={type} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {findModuleDef(type)?.name ?? type} <b className="ml-1">{count}</b>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {pages.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-400">아직 만든 기획전이 없습니다.</p>
      ) : (
        <ul className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {pages.map((p) => {
            const s = stats[p.id] ?? { views: 0, clicks: 0 };
            return (
              <li key={p.id}>
                <Link href={`/admin/md/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      /md/{p.slug} · {visibilityNote(p.status, p.startsAt, p.endsAt)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      조회 <b className="text-gray-800">{s.views.toLocaleString("ko-KR")}</b>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      클릭 <b className="text-gray-800">{s.clicks.toLocaleString("ko-KR")}</b>
                    </p>
                  </div>

                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {STATUS_LABEL[p.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
