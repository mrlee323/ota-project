"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SYSTEM_TEMPLATES } from "@/domain/md/template";
import type { MdPage } from "@/domain/md/page";

interface Props {
  onDone: (page: MdPage, note: string) => void;
  onCancel: () => void;
}

/**
 * 요청서 — L1 의 입력 (llm.md §2).
 *
 * 자유 대화가 아니라 «정형 폼» 이다. 자유 입력이면 다른 기획전 문구가 복붙으로
 * 섞여 들어오고, 그건 AI 로 거르는 것보다 폼을 구조화하는 편이 낫다.
 */
export function RequestForm({ onDone, onCancel }: Props) {
  const [templateId, setTemplateId] = useState(SYSTEM_TEMPLATES[0].id);
  const [intent, setIntent] = useState("");
  const [highlight, setHighlight] = useState("");
  const [period, setPeriod] = useState("");
  const [hotelIds, setHotelIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/md/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        intent,
        highlight: highlight || undefined,
        period: period || undefined,
        hotelIds: hotelIds.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) return setError(body.error ?? "생성에 실패했습니다");

    const note =
      body.attempt === null
        ? "값을 뽑지 못해 샘플로 채웠습니다. 직접 고쳐 주세요."
        : body.issues?.length
          ? `일부는 샘플로 채웠습니다 — ${body.issues[0]}`
          : "초안을 만들었습니다. 확인하고 저장하세요.";
    onDone(body.page as MdPage, note);
  };

  const field = "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] focus:border-brand focus:outline-none";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-700">구성</label>
        <select className={field} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {SYSTEM_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-700">
          무엇을 파나요 <span className="text-red-500">*</span>
        </label>
        <textarea
          className={field}
          rows={3}
          placeholder="예: 가을 오사카 여행객을 위한 4성급 이상 호텔 특가"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-700">강조할 점</label>
        <input className={field} value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="예: 조식 포함, 시내 접근성" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-700">기간 문구</label>
          <input className={field} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="9.1 ~ 9.30" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-700">호텔 id</label>
          <input className={field} value={hotelIds} onChange={(e) => setHotelIds(e.target.value)} placeholder="1, 2, 3" />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-400">
        호텔은 담당자가 고릅니다. 목록에 없는 호텔은 만들어내지 않습니다.
        이미지는 생성하지 않으니 캔버스에서 채우세요.
      </p>

      {error ? <p className="text-xs leading-relaxed text-red-500">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || intent.trim().length < 2}
          onClick={submit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[13px] font-semibold text-white disabled:bg-gray-300"
        >
          <Sparkles size={14} />
          {busy ? "만드는 중…" : "초안 만들기"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-3 py-2 text-[13px] text-gray-600">
          직접 고르기
        </button>
      </div>
    </div>
  );
}
