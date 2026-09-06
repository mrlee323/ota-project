"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import type { MdPage, MdBlock } from "@/domain/md/page";
import { blockFromDef, validatePage } from "@/domain/md/page";
import type { ModuleDef } from "@/domain/md/moduleDef";
import { MODULE_DEFS, findModuleDef } from "@/domain/md/modules";
import { findGroups, duplicateGroup, removeGroup, normalizeGroups } from "@/domain/md/group";
import type { Template } from "@/domain/md/template";
import { BlockFields } from "./BlockFields";
import { MdPreview } from "./MdPreview";
import { TemplatePicker } from "./TemplatePicker";

interface Props {
  pageId: string;
  slug: string;
  initialTitle: string;
  initialPage: MdPage;
}

let seq = 0;
const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export function MdCanvas({ pageId, slug, initialTitle, initialPage }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<MdBlock[]>(initialPage.blocks);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const page: MdPage = useMemo(() => ({ schemaVersion: 1, blocks }), [blocks]);
  const groups = useMemo(() => findGroups(blocks), [blocks]);
  const issues = useMemo(() => validatePage(page, MODULE_DEFS), [page]);

  const addModule = (def: ModuleDef) => {
    const b = blockFromDef(def, newId());
    setBlocks((prev) => [...prev, b]);
    setOpenId(b.id);
  };

  const applyTemplate = (t: Template) => {
    setBlocks(
      t.blocks.map((tb) => {
        const def = findModuleDef(tb.moduleType);
        const base = def
          ? blockFromDef(def, newId(), tb.group)
          : { id: newId(), moduleType: tb.moduleType, moduleVersion: tb.moduleVersion, values: {} };
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

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const payload: MdPage = { schemaVersion: 1, blocks: normalizeGroups(blocks) };

    const res = await fetch(`/api/admin/md/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, page: payload }),
    });
    const body = await res.json().catch(() => ({}));

    setSaving(false);
    setMessage(res.ok ? "저장했습니다" : (body.error ?? "저장에 실패했습니다"));
    if (res.ok) setBlocks(payload.blocks);
  };

  if (blocks.length === 0) {
    return (
      <div className="mx-auto max-w-[860px] px-6 py-14">
        <h1 className="text-[22px] font-bold text-gray-800">어떤 기획전인가요?</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          빈 화면 대신 이미 조립된 구성에서 시작합니다. 고른 뒤에 자유롭게 바꿀 수 있습니다.
        </p>
        <div className="mt-6">
          <TemplatePicker onPick={applyTemplate} />
        </div>
        <p className="mt-5 text-xs text-gray-400">
          빈 페이지에서 시작하려면 아래 블록을 직접 얹으세요.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MODULE_DEFS.map((d) => (
            <button
              key={d.type}
              type="button"
              title={d.whenToUse}
              onClick={() => addModule(d)}
              className="rounded-full border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:border-brand hover:bg-brand-50"
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── 왼쪽: 블록 패널 ─────────────────────────────── */}
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
          <input
            className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm font-bold text-gray-800 focus:border-brand focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="기획전 제목"
          />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">작성 중</span>
            <span className="truncate text-xs text-gray-400">/md/{slug}</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={save}
              disabled={saving || issues.length > 0}
              title={issues.length > 0 ? "채우지 않은 필수 항목이 있습니다" : undefined}
              className="rounded-md bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:bg-gray-300"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
          {message ? <p className="text-xs text-gray-600">{message}</p> : null}
        </div>

        {/* 블록 추가 칩 */}
        <div className="border-b border-gray-200 px-4 py-3.5">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-400">블록 추가</p>
          <div className="flex flex-wrap gap-1.5">
            {MODULE_DEFS.map((d) => (
              <button
                key={d.type}
                type="button"
                title={d.whenToUse}
                onClick={() => addModule(d)}
                className="rounded-full border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:border-brand hover:bg-brand-50"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* 블록 목록 */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
          {blocks.map((b, i) => {
            const def = findModuleDef(b.moduleType);
            const group = b.group ? groups.find((g) => g.id === b.group!.id) : undefined;
            const isGroupEnd = group?.end === i + 1;
            const open = openId === b.id;
            const bad = issues.some((x) => x.blockId === b.id);

            return (
              <div key={b.id}>
                <div
                  className={[
                    "rounded-lg border bg-white",
                    open ? "border-brand shadow-[0_1px_3px_rgba(103,40,224,.10)]" : "border-gray-200",
                    group ? "border-l-4 border-l-amber-400" : "",
                  ].join(" ")}
                >
                  <div
                    className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                    onClick={() => setOpenId(open ? null : b.id)}
                  >
                    <span className="text-[13px] text-gray-700">{def?.name ?? b.moduleType}</span>
                    {group && group.start === i ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                        {group.type} 구간
                      </span>
                    ) : null}
                    {bad ? <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                    <div className="flex-1" />
                    <button type="button" aria-label="위로" onClick={(e) => { e.stopPropagation(); move(i, -1); }} className="p-0.5 text-gray-400 hover:text-gray-700">
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" aria-label="아래로" onClick={(e) => { e.stopPropagation(); move(i, 1); }} className="p-0.5 text-gray-400 hover:text-gray-700">
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" aria-label="삭제" onClick={(e) => { e.stopPropagation(); setBlocks((p) => p.filter((x) => x.id !== b.id)); }} className="p-0.5 text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>

                  {open && def ? (
                    <BlockFields
                      def={def}
                      block={b}
                      onChange={(values) =>
                        setBlocks((p) => p.map((x) => (x.id === b.id ? { ...x, values } : x)))
                      }
                    />
                  ) : null}
                </div>

                {/* 구간의 끝 — 담당자의 조립 단위는 블록이 아니라 «호텔 한 곳» 이다 */}
                {isGroupEnd ? (
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBlocks((p) => duplicateGroup(p, group!.id, MODULE_DEFS))}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <Plus size={13} /> {group!.type} 구간 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlocks((p) => removeGroup(p, group!.id))}
                      className="rounded-lg border border-gray-200 px-2.5 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      구간 삭제
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── 오른쪽: 미리보기 ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-gray-50">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <span className="text-xs font-semibold text-gray-500">미리보기</span>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">서비스와 같은 렌더러</span>
          <a href={`/md/${slug}`} target="_blank" rel="noreferrer" className="text-xs text-gray-500 underline">
            공개 화면
          </a>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <MdPreview page={page} />
        </div>
      </div>
    </div>
  );
}
