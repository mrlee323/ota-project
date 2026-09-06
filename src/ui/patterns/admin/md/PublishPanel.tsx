"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  allowedActions, ACTION_LABEL, STATUS_LABEL, visibilityNote,
  type MdAction, type MdStatus,
} from "@/domain/md/status";

interface Props {
  pageId: string;
  slug: string;
  status: MdStatus;
  startsAt: string | null;
  endsAt: string | null;
}

/** ISO ↔ datetime-local */
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

export function PublishPanel({ pageId, slug, status, startsAt, endsAt }: Props) {
  const router = useRouter();
  const [starts, setStarts] = useState(toLocal(startsAt));
  const [ends, setEnds] = useState(toLocal(endsAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: MdAction) => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/md/${pageId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, startsAt: toIso(starts), endsAt: toIso(ends) }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "실패했습니다");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {STATUS_LABEL[status]}
        </span>
        <span className="truncate text-xs text-gray-400">
          {visibilityNote(status, startsAt, endsAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-600">노출 시작</span>
          <input
            type="datetime-local"
            className="rounded-md border border-gray-300 px-2 py-1 text-[12px]"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-600">노출 종료</span>
          <input
            type="datetime-local"
            className="rounded-md border border-gray-300 px-2 py-1 text-[12px]"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
          />
        </label>
      </div>
      <p className="text-[11px] text-gray-400">비워 두면 기간 제한 없이 공개됩니다.</p>

      <div className="flex flex-wrap gap-1.5">
        {allowedActions(status).map((a) => (
          <button
            key={a}
            type="button"
            disabled={busy}
            onClick={() => run(a)}
            className={
              a === "publish"
                ? "rounded-md bg-brand px-3 py-1.5 text-[13px] font-semibold text-white disabled:bg-gray-300"
                : "rounded-md border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700 disabled:text-gray-300"
            }
          >
            {ACTION_LABEL[a]}
          </button>
        ))}
        <a
          href={`/api/md/preview?slug=${encodeURIComponent(slug)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700"
        >
          미리보기
        </a>
      </div>

      {error ? <p className="text-xs leading-relaxed text-red-500">{error}</p> : null}
    </div>
  );
}
