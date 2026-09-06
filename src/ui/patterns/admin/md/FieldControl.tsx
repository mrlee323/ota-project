"use client";

import type { FieldDef } from "@/domain/md/moduleDef";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const base =
  "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

/**
 * 필드 하나를 그린다 — **모듈 정의의 `input` 이 컨트롤을 고른다.**
 *
 * 모듈별로 폼을 손으로 짜지 않는 이유가 여기 있다 (FR-3.3):
 * 손으로 짜기 시작하면 모듈을 추가할 때마다 폼도 만들어야 하고,
 * 그러면 「모듈 추가 = 2곳」(AC-2)이 깨진다. 스키마 층이 무의미해진다.
 */
export function FieldControl({ field, value, onChange }: Props) {
  // preset 은 정해진 값 중에서만 고른다 (FR-1.7 · D7)
  if (field.freedom === "preset" && field.options?.length) {
    return (
      <select className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">선택 안 함</option>
        {field.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  switch (field.input) {
    case "textarea":
      return (
        <textarea
          className={base}
          rows={3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className={base}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );

    case "color-free":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border border-gray-300"
            value={typeof value === "string" && value.startsWith("#") ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            className={base}
            placeholder="#RRGGBB"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value || undefined)}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-1">
          <input
            className={base}
            placeholder="https://..."
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value || undefined)}
          />
          {typeof value === "string" && value.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element -- 담당자가 넣은 임의 URL 의 미리보기다
            <img src={value} alt="" className="h-16 w-full rounded object-cover" />
          ) : null}
        </div>
      );

    case "hotel-refs":
      // 호텔 «선택기» 는 아직 없다. id 를 직접 넣는다 — 실재 검증은 서버가 한다
      return (
        <input
          className={base}
          placeholder="호텔 id (쉼표로 구분)"
          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
        />
      );

    default:
      return (
        <input
          className={base}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
}
