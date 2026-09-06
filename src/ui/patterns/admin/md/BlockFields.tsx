"use client";

import type { MdBlock } from "@/domain/md/page";
import type { ModuleDef } from "@/domain/md/moduleDef";
import { validateBlock } from "@/domain/md/moduleDef";
import { FieldControl } from "./FieldControl";
import { ImageGenButton } from "./ImageGenButton";
import type { MdPage } from "@/domain/md/page";

interface Props {
  def: ModuleDef;
  block: MdBlock;
  onChange: (values: Record<string, unknown>) => void;
  /** 이미지 생성이 문맥을 읽으려면 페이지 전체가 필요하다 */
  imageContext?: { pageId: string; pageTitle: string; page: MdPage };
}

/**
 * 펼쳐진 블록의 필드 편집 — **모듈 정의로 자동 생성한다** (FR-3.3).
 *
 * 모듈별 폼을 손으로 짜지 않는다. 짜기 시작하면 모듈 하나 추가에 파일이 3개가 되고
 * AC-2(모듈 추가 = 2곳)가 깨진다.
 *
 * 검증은 편집 중에 보여준다. 저장 때 처음 알려주면 고치기 늦다.
 */
export function BlockFields({ def, block, onChange, imageContext }: Props) {
  const issues = validateBlock(def, block.values);
  const issueOf = (key: string) => issues.find((i) => i.key === key)?.message;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 p-3">
      {def.fields.map((f) => {
        const err = issueOf(f.key);
        return (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-700">
              {f.label}
              {f.required ? <span className="ml-0.5 text-red-500">*</span> : null}
            </label>

            {f.repeatable && f.input === "textarea" ? (
              // 목록형 — 줄바꿈으로 항목을 나눈다. 담당자에게 가장 익숙한 방식이다
              <textarea
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] focus:border-brand focus:outline-none"
                rows={4}
                value={
                  Array.isArray(block.values[f.key])
                    ? (block.values[f.key] as string[]).join("\n")
                    : ""
                }
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

            {/* 이미지 필드에만 생성 버튼을 단다 (FR-11.1) */}
            {f.input === "image" && imageContext ? (
              <ImageGenButton
                pageId={imageContext.pageId}
                pageTitle={imageContext.pageTitle}
                page={imageContext.page}
                blockId={block.id}
                onPick={(url) => onChange({ ...block.values, [f.key]: url })}
              />
            ) : null}

            <span className={`text-[11px] leading-relaxed ${err ? "text-red-500" : "text-gray-400"}`}>
              {err ?? f.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
