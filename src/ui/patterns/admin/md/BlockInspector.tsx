"use client";

import type { MdBlock } from "@/domain/md/page";
import { findModuleDef } from "@/domain/md/modules";
import { validateBlock } from "@/domain/md/moduleDef";
import { FieldControl } from "./FieldControl";

interface Props {
  block: MdBlock | null;
  onChange: (values: Record<string, unknown>) => void;
}

/**
 * 우측 편집 패널.
 *
 * **폼을 모듈 정의로 자동 생성한다** (FR-3.3). 모듈별 편집 폼을 손으로 짜지 않는다 —
 * 짜기 시작하면 모듈 하나 추가에 파일이 3개가 되고 AC-2 가 깨진다.
 *
 * 검증도 저장 때만 하지 않는다. 편집 중에 바로 보여줘야 담당자가 고칠 수 있다.
 */
export function BlockInspector({ block, onChange }: Props) {
  if (!block) {
    return (
      <div className="p-4 text-sm text-gray-400">
        왼쪽에서 블록을 선택하면 여기서 편집합니다.
      </div>
    );
  }

  const def = findModuleDef(block.moduleType);
  if (!def) {
    return (
      <div className="p-4 text-sm text-red-500">
        알 수 없는 모듈입니다: {block.moduleType}
      </div>
    );
  }

  const issues = validateBlock(def, block.values);
  const issueOf = (key: string) => issues.find((i) => i.key === key)?.message;

  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-sm font-bold text-gray-800">{def.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{def.description}</p>
      </div>

      {def.fields.map((f) => {
        const err = issueOf(f.key);
        return (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {f.label}
              {f.required ? <span className="ml-0.5 text-red-500">*</span> : null}
            </label>

            {f.repeatable && f.input === "textarea" ? (
              // 목록형 — 줄바꿈으로 항목을 나눈다. 담당자에게 가장 익숙한 방식이다
              <textarea
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                rows={4}
                value={Array.isArray(block.values[f.key]) ? (block.values[f.key] as string[]).join("\n") : ""}
                onChange={(e) =>
                  onChange({
                    ...block.values,
                    [f.key]: e.target.value.split("\n").filter((s) => s.trim()),
                  })
                }
              />
            ) : (
              <FieldControl
                field={f}
                value={block.values[f.key]}
                onChange={(v) => onChange({ ...block.values, [f.key]: v })}
              />
            )}

            <p className={`mt-1 text-xs ${err ? "text-red-500" : "text-gray-400"}`}>
              {err ?? f.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
