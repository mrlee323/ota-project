"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import type { TokenSummary } from "@/infrastructure/mcp/auth";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "—";

/**
 * MCP 토큰 발급·폐기.
 *
 * **원문은 발급 직후 한 번만 보인다.** DB 에는 해시만 있어서 다시 볼 수 없다 —
 * 유출 경로를 하나 줄이는 대신 «다시 보기» 를 포기한다.
 *
 * **`window.prompt`·`window.confirm` 을 쓰지 않는다.** 네이티브 대화상자는 렌더러를
 * 통째로 막아서 AI 클라이언트나 자동화가 이 화면을 통과할 수 없다. 브라우저가
 * «추가 대화상자 차단» 을 걸면 사람이 눌러도 아무 일이 안 일어난다 — 실제로 그렇게 막혔다.
 * MCP 토큰은 AI 도구에 붙이려고 만드는 것인데 그 입구가 사람 손을 강제하면 앞뒤가 안 맞는다.
 */
export function McpTokenPanel({ tokens }: { tokens: TokenSummary[] }) {
  const router = useRouter();
  const [issued, setIssued] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 라벨 입력 중이면 문자열, 아니면 null — null 여부가 곧 입력창 표시 여부다 */
  const [label, setLabel] = useState<string | null>(null);
  /** 끊기 확인을 기다리는 토큰 id */
  const [confirming, setConfirming] = useState<string | null>(null);

  const issue = async () => {
    if (!label?.trim()) return;

    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/md/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(b.error ?? "발급에 실패했습니다");
    setIssued(b.token);
    setLabel(null);
    router.refresh();
  };

  const revoke = async (id: string) => {
    setConfirming(null);
    setBusy(true);
    await fetch(`/api/admin/md/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-800">AI 연결 토큰</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            Codex·Claude 같은 AI 도구에서 기획전을 만들 때 씁니다. 초안만 만들 수 있고 발행은 되지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLabel("");
          }}
          disabled={busy || label !== null}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700 disabled:text-gray-300"
        >
          토큰 발급
        </button>
      </div>

      {label !== null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void issue();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            placeholder="어디에 쓸 토큰인가요? (예: 내 노트북 Codex)"
            aria-label="토큰 이름"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[13px] text-gray-800 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={busy || !label.trim()}
            className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-[13px] text-white disabled:bg-gray-300"
          >
            발급
          </button>
          <button
            type="button"
            onClick={() => setLabel(null)}
            className="shrink-0 px-2 py-1.5 text-[13px] text-gray-500"
          >
            취소
          </button>
        </form>
      ) : null}

      {issued ? (
        <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3">
          <p className="text-[11px] font-semibold text-brand-700">
            지금만 보입니다 — 복사해서 안전한 곳에 두세요
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 text-[11px] text-gray-800">
              {issued}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(issued)}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-600"
            >
              <Copy size={11} /> 복사
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      {tokens.length > 0 ? (
        <ul className="mt-3 divide-y divide-gray-100">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-gray-800">
                  {t.label}
                  {t.revokedAt ? <span className="ml-2 text-[11px] text-red-500">끊김</span> : null}
                </p>
                <p className="text-[11px] text-gray-400">
                  마지막 사용 {fmt(t.lastUsedAt)} · 발급 {fmt(t.createdAt)}
                </p>
              </div>
              {t.revokedAt ? null : confirming === t.id ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-gray-500">이 연결은 즉시 끊깁니다</span>
                  <button
                    type="button"
                    onClick={() => void revoke(t.id)}
                    disabled={busy}
                    className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 disabled:text-red-300"
                  >
                    끊기
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="px-1 text-[11px] text-gray-500"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(t.id)}
                  disabled={busy}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label="토큰 끊기"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
