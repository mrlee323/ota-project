"use client";

import { SYSTEM_TEMPLATES, type Template } from "@/domain/md/template";

/**
 * 템플릿 선택.
 *
 * 빈 캔버스 대신 «이미 조립된 것» 에서 시작한다 (FR-3.5).
 * 4종의 근거는 실사에 있다 — 표본 7건을 100% 커버한 조합이다.
 *
 * 지금은 코드 상수(SYSTEM_TEMPLATES)를 읽지만, DB 시드와 같은 내용이다.
 * 사용자 템플릿이 붙으면 DB 조회로 바꾼다 (FR-9.3).
 */
export function TemplatePicker({ onPick }: { onPick: (t: Template) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {SYSTEM_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onPick(t)}
          className="rounded-lg border border-gray-200 p-4 text-left hover:border-brand hover:bg-brand-50"
        >
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800">{t.name}</p>
            {/* 이미지 없이 만들 수 있다는 건 담당자에게도 보여야 한다 (AC-3) */}
            {t.blocks.every((b) => b.moduleType !== "image") ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                이미지 0장
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{t.description}</p>
          <p className="mt-2 text-xs text-gray-400">
            {t.blocks.map((b) => b.moduleType).join(" → ")}
          </p>
        </button>
      ))}
    </div>
  );
}
