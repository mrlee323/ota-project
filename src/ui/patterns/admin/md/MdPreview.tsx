"use client";

import { useEffect, useState } from "react";
import type { MdPage } from "@/domain/md/page";
import { MdPageRenderer } from "@/ui/patterns/md/MdPageRenderer";

/**
 * 캔버스 미리보기 — **서비스와 같은 렌더러를 그대로 쓴다** (FR-3.4).
 *
 * 별도 미리보기 컴포넌트를 만들지 않는다. 만드는 순간
 * «미리보기에선 됐는데 발행하니 다르다» 가 생긴다.
 *
 * 바깥 데이터(호텔 골격)만 서버에 물어본다 — 공개 페이지가 부르는 함수와 같은 것이다.
 */
export function MdPreview({ page }: { page: MdPage }) {
  const [resolved, setResolved] = useState<Record<string, Record<string, unknown>>>({});

  // 호텔 참조가 바뀔 때만 다시 물어본다. 글자 한 자마다 부르지 않는다
  const refKey = JSON.stringify(
    page.blocks
      .filter((b) => b.moduleType === "hotel-card-list")
      .map((b) => [b.id, b.values.hotelRefs]),
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/md/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page),
    })
      .then((r) => (r.ok ? r.json() : { resolved: {} }))
      .then((d) => alive && setResolved(d.resolved ?? {}))
      // 해석에 실패해도 나머지 블록은 그려진다
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- page 전체가 아니라 호텔 참조가 바뀔 때만 다시 부른다
  }, [refKey]);

  if (page.blocks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        블록을 추가하면 여기에 보입니다.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
      <MdPageRenderer page={page} resolved={resolved} />
    </div>
  );
}
