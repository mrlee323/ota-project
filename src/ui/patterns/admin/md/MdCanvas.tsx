"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Copy } from "lucide-react";
import type { MdPage, MdBlock } from "@/domain/md/page";
import { blockFromDef, validatePage } from "@/domain/md/page";
import type { ModuleDef } from "@/domain/md/moduleDef";
import { MODULE_DEFS, findModuleDef } from "@/domain/md/modules";
import { findGroups, duplicateGroup, removeGroup, normalizeGroups } from "@/domain/md/group";
import type { Template } from "@/domain/md/template";
import { ModulePalette } from "./ModulePalette";
import { BlockInspector } from "./BlockInspector";
import { TemplatePicker } from "./TemplatePicker";

interface Props {
  pageId: string;
  slug: string;
  initialTitle: string;
  initialPage: MdPage;
}

let idSeq = 0;
const newId = () => `b${Date.now().toString(36)}${(idSeq++).toString(36)}`;

export function MdCanvas({ pageId, slug, initialTitle, initialPage }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<MdBlock[]>(initialPage.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const groups = useMemo(() => findGroups(blocks), [blocks]);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  // 편집 중에도 계속 검증한다 — 저장 때 처음 알려주면 고치기 늦다
  const issues = useMemo(
    () => validatePage({ schemaVersion: 1, blocks }, MODULE_DEFS),
    [blocks],
  );

  const addModule = (def: ModuleDef) => {
    const b = blockFromDef(def, newId());
    setBlocks((prev) => [...prev, b]);
    setSelectedId(b.id);
  };

  const applyTemplate = (t: Template) => {
    setBlocks(
      t.blocks.map((tb) => {
        const def = findModuleDef(tb.moduleType);
        const base = def
          ? blockFromDef(def, newId(), tb.group)
          : { id: newId(), moduleType: tb.moduleType, moduleVersion: tb.moduleVersion, values: {} };
        // 템플릿이 값을 들고 있으면 샘플 위에 덮어쓴다 (FR-9.6)
        return tb.values ? { ...base, values: { ...base.values, ...tb.values } } : base;
      }),
    );
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[to]] = [next[to], next[index]];
    // 묶음이 흩어질 수 있다 — 막지 않고 정규화한다 (design.md §5)
    setBlocks(normalizeGroups(next));
  };

  const remove = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const page: MdPage = { schemaVersion: 1, blocks: normalizeGroups(blocks) };

    const res = await fetch(`/api/admin/md/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, page }),
    });

    const body = await res.json().catch(() => ({}));
    setSaving(false);
    setMessage(res.ok ? "저장했습니다" : (body.error ?? "저장에 실패했습니다"));
    if (res.ok) setBlocks(page.blocks);
  };

  if (blocks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-lg font-bold text-gray-800">템플릿으로 시작하기</h1>
        <p className="mt-1 text-sm text-gray-500">
          빈 화면 대신 이미 조립된 구성에서 시작합니다. 나중에 자유롭게 바꿀 수 있습니다.
        </p>
        <div className="mt-5">
          <TemplatePicker onPick={applyTemplate} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 팔레트 */}
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
        <ModulePalette onAdd={addModule} />
      </aside>

      {/* 블록 목록 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <input
            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="기획전 제목"
          />
          <a
            href={`/md/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 underline"
          >
            공개 화면
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving || issues.length > 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-300"
            title={issues.length > 0 ? "채우지 않은 필수 항목이 있습니다" : undefined}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>

        {message ? (
          <p className="border-b border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">{message}</p>
        ) : null}

        <ul className="space-y-2 p-4">
          {blocks.map((b, i) => {
            const def = findModuleDef(b.moduleType);
            const group = b.group ? groups.find((g) => g.id === b.group!.id) : undefined;
            const isGroupStart = group?.start === i;
            const isGroupEnd = group?.end === i + 1;
            const blockIssues = issues.filter((x) => x.blockId === b.id);

            return (
              <li key={b.id}>
                <div
                  onClick={() => setSelectedId(b.id)}
                  className={[
                    "cursor-pointer rounded-md border bg-white px-3 py-2.5",
                    selectedId === b.id ? "border-blue-500" : "border-gray-200",
                    // 묶음은 테두리로 감싸 «블록 4개» 가 아니라 «호텔 1곳» 으로 보이게 한다
                    group ? "border-l-4 border-l-amber-400" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {def?.name ?? b.moduleType}
                        {isGroupStart ? (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                            {group!.type} 구간
                          </span>
                        ) : null}
                      </p>
                      {blockIssues.length > 0 ? (
                        <p className="mt-0.5 truncate text-xs text-red-500">
                          {blockIssues[0].message}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 text-gray-400">
                      <button type="button" onClick={(e) => { e.stopPropagation(); move(i, -1); }} className="p-1 hover:text-gray-700" aria-label="위로">
                        <ChevronUp size={15} />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); move(i, 1); }} className="p-1 hover:text-gray-700" aria-label="아래로">
                        <ChevronDown size={15} />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); remove(b.id); }} className="p-1 hover:text-red-500" aria-label="삭제">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 구간의 끝에 «구간 추가» — 담당자의 조립 단위는 블록이 아니라 «호텔 한 곳» 이다 */}
                {isGroupEnd ? (
                  <div className="mt-1 flex gap-1.5 pl-4">
                    <button
                      type="button"
                      onClick={() => setBlocks((prev) => duplicateGroup(prev, group!.id, MODULE_DEFS))}
                      className="flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"
                    >
                      <Plus size={12} /> {group!.type} 구간 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlocks((prev) => removeGroup(prev, group!.id))}
                      className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      <Copy size={12} /> 이 구간 삭제
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 우측 편집 패널 */}
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
        <BlockInspector
          block={selected}
          onChange={(values) =>
            setBlocks((prev) => prev.map((b) => (b.id === selectedId ? { ...b, values } : b)))
          }
        />
      </aside>
    </div>
  );
}
