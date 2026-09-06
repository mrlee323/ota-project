"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { MdPage } from "@/domain/md/page";

interface Props {
  pageId: string;
  pageTitle: string;
  page: MdPage;
  blockId: string;
  onPick: (url: string) => void;
}

/**
 * 캔버스 전용 이미지 생성 (FR-11).
 *
 * **프롬프트 칸을 앞세우지 않는다.** 서버가 문맥(슬롯·인접 블록 문구·페이지 색)을
 * 붙이므로 담당자는 버튼만 누르면 된다. 의도는 «선택» 이다.
 *
 * 결과는 후보로 쌓아 보여주고 담당자가 고른다 — 자동으로 꽂지 않는다.
 */
export function ImageGenButton({ pageId, pageTitle, page, blockId, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/md/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, pageTitle, blockId, page, intent: intent || undefined }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (b.quota) setQuota(b.quota);
    if (!res.ok) return setError(b.error ?? "만들지 못했습니다");
    setCandidates((prev) => [b.url, ...prev].slice(0, 4));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 self-start rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 hover:border-brand hover:text-brand"
      >
        <Sparkles size={11} /> AI로 만들기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
      <input
        className="w-full rounded border border-gray-300 px-2 py-1 text-[12px]"
        placeholder="분위기 (비워도 됩니다)"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
      />
      <p className="text-[10px] leading-relaxed text-gray-400">
        페이지 제목·앞뒤 문구·색을 참고해 만듭니다. 글자·사람·실제 건물은 넣지 않습니다.
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded bg-brand px-2.5 py-1 text-[11px] font-semibold text-white disabled:bg-gray-300"
        >
          {busy ? "만드는 중…" : candidates.length ? "다시 만들기" : "만들기"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-gray-500">
          닫기
        </button>
        {quota ? (
          <span className="ml-auto text-[10px] text-gray-400">
            오늘 {quota.remaining}/{quota.limit}장 남음
          </span>
        ) : null}
      </div>

      {error ? <p className="text-[11px] leading-relaxed text-red-500">{error}</p> : null}

      {candidates.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {candidates.map((u) => (
            <button key={u} type="button" onClick={() => { onPick(u); setOpen(false); }} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- 방금 생성한 Supabase storage URL 이다 */}
              <img src={u} alt="" className="aspect-[3/2] w-full rounded border border-gray-200 object-cover group-hover:border-brand" />
              <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] text-white opacity-0 group-hover:opacity-100">
                이걸로
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
