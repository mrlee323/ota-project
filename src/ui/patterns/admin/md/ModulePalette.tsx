"use client";

import { MODULE_DEFS } from "@/domain/md/modules";
import type { ModuleDef } from "@/domain/md/moduleDef";

const CATEGORIES = ["헤더", "본문", "푸터"] as const;

/**
 * 모듈 팔레트.
 *
 * 지금은 6종이라 전부 나열해도 된다. **모듈이 100개가 되면 이 방식은 무너진다** —
 * 그때는 스크롤이 아니라 검색·추천이 필요하고, 그게 MCP 를 붙이는 1번 이유다
 * (docs/md/mcp.md §1 P1). 여기서는 `whenToUse` 를 툴팁으로 보여주는 정도로 대비한다.
 */
export function ModulePalette({ onAdd }: { onAdd: (def: ModuleDef) => void }) {
  return (
    <div className="space-y-3 p-3">
      {CATEGORIES.map((cat) => {
        const defs = MODULE_DEFS.filter((d) => d.category === cat);
        if (defs.length === 0) return null;
        return (
          <div key={cat}>
            <p className="mb-1 text-xs font-semibold text-gray-400">{cat}</p>
            <div className="space-y-1">
              {defs.map((d) => (
                <button
                  key={d.type}
                  type="button"
                  title={d.whenToUse}
                  onClick={() => onAdd(d)}
                  className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-left text-sm hover:border-blue-400 hover:bg-blue-50"
                >
                  <span className="font-medium text-gray-800">{d.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-gray-400">
                    {d.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
