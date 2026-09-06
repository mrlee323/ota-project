"use client";

import { useEffect } from "react";

/**
 * 조회·클릭 적재 (FR-8).
 *
 * 렌더러가 남긴 `data-md-block` 표식을 위임 리스너 하나로 잡는다 —
 * 모듈마다 핸들러를 달면 모듈 추가가 2곳을 넘는다 (AC-2).
 *
 * 실패해도 조용히 넘어간다. 측정이 페이지를 깨뜨리면 안 된다.
 */
export function MdTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    const send = (body: Record<string, unknown>) => {
      const payload = JSON.stringify({ pageId, ...body });
      // 페이지를 떠나는 중이어도 전송되게 한다
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/md/events", new Blob([payload], { type: "application/json" }));
        return;
      }
      fetch("/api/md/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    send({ event: "view" });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-md-block]");
      if (!(el instanceof HTMLElement)) return;
      send({
        event: "click",
        blockId: el.dataset.mdBlock,
        moduleType: el.dataset.mdModule,
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pageId]);

  return null;
}
