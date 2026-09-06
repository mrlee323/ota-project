"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 새 기획전은 항상 draft 로 만든다. 발행은 별도 행위다 (FR-5.6) */
export function MdCreateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const title = window.prompt("기획전 제목");
    if (!title) return;
    const slug = window.prompt("공개 주소 (영문 소문자·숫자·하이픈)", "");
    if (!slug) return;

    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/md", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) return setError(body.error ?? "생성에 실패했습니다");
    router.push(`/admin/content/md/${body.id}`);
  };

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300"
      >
        {busy ? "만드는 중…" : "새 기획전"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
