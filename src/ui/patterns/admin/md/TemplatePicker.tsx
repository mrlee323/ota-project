"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Trash2 } from "lucide-react";
import type { Template } from "@/domain/md/template";

/**
 * 템플릿 선택.
 *
 * 빈 캔버스 대신 «이미 조립된 것» 에서 시작한다 (FR-3.5).
 * 시스템 4종의 근거는 실사에 있다 — 표본 7건을 100% 커버한 조합이다.
 * 여기에 담당자가 저장한 자기 구성이 얹히고(FR-9.3), 즐겨찾기가 위로 온다(FR-9.4).
 */

interface Item {
  template: Template;
  favorite: boolean;
}

export function TemplatePicker({ onPick, reloadKey }: { onPick: (t: Template) => void; reloadKey?: number }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/md/templates");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setError(body.error ?? "템플릿을 불러오지 못했습니다");
    setItems(body.items as Item[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const toggleFavorite = async (templateId: string, on: boolean) => {
    // 먼저 화면을 바꾼다 — 별 하나 누르는 데 기다리게 하지 않는다
    setItems((prev) =>
      (prev ?? []).map((i) => (i.template.id === templateId ? { ...i, favorite: on } : i)),
    );
    const res = await fetch("/api/admin/md/templates/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, on }),
    });
    // 실패하면 서버 상태로 되돌린다
    if (!res.ok) void load();
  };

  const remove = async (t: Template) => {
    if (!confirm(`「${t.name}」 템플릿을 지울까요? 이미 만든 기획전은 그대로 남습니다.`)) return;
    const res = await fetch(`/api/admin/md/templates?id=${encodeURIComponent(t.id)}`, {
      method: "DELETE",
    });
    if (res.ok) void load();
  };

  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!items) return <p className="text-xs text-gray-400">불러오는 중…</p>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(({ template: t, favorite }) => (
        <div
          key={t.id}
          className="relative rounded-lg border border-gray-200 hover:border-brand hover:bg-brand-50"
        >
          <button type="button" onClick={() => onPick(t)} className="block w-full p-4 text-left">
            <div className="flex items-center gap-2 pr-14">
              <p className="font-bold text-gray-800">{t.name}</p>
              {t.kind === "user" ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  내 구성
                </span>
              ) : null}
              {/* 이미지 없이 만들 수 있다는 건 담당자에게도 보여야 한다 (AC-3) */}
              {t.blocks.every((b) => b.moduleType !== "image") ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                  이미지 0장
                </span>
              ) : null}
            </div>
            {t.description ? (
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{t.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-gray-400">
              {t.blocks.map((b) => b.moduleType).join(" → ")}
            </p>
          </button>

          <div className="absolute right-2 top-2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => toggleFavorite(t.id, !favorite)}
              aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기"}
              aria-pressed={favorite}
              className="rounded p-1.5 text-gray-300 hover:bg-white hover:text-amber-500"
            >
              <Star size={15} className={favorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>
            {t.kind === "user" ? (
              <button
                type="button"
                onClick={() => remove(t)}
                aria-label="템플릿 삭제"
                className="rounded p-1.5 text-gray-300 hover:bg-white hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
