"use client";

import { useEffect, useState } from "react";
import { tokens } from "@ds/design-system";
import type { HotelPrice as Price } from "@/infrastructure/md/hotelLookup";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원~`;

/**
 * 카드의 «변동 값» 층 (design.md §6).
 *
 * 페이지 골격은 ISR 로 캐시되므로 가격까지 서버에서 그리면 낡은 값이 남는다.
 * 가격만 클라이언트에서 채워 항상 최신으로 만든다 (FR-6.3).
 *
 * 자리는 미리 잡아 둔다 — 값이 늦게 와도 카드가 흔들리지 않는다 (CLS).
 */
export function HotelPrice({ hotelId, prices }: { hotelId: string; prices?: Price[] }) {
  const [price, setPrice] = useState<Price | null>(
    () => prices?.find((p) => p.id === hotelId) ?? null,
  );

  useEffect(() => {
    if (price) return;
    let alive = true;
    fetch(`/api/md/hotel-prices?ids=${encodeURIComponent(hotelId)}`)
      .then((r) => (r.ok ? r.json() : { prices: [] }))
      .then((d: { prices: Price[] }) => {
        if (alive) setPrice(d.prices[0] ?? null);
      })
      // 가격을 못 불러와도 카드는 남는다 — 페이지 전체를 깨뜨리지 않는다
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hotelId, price]);

  return (
    <div className="mt-2 min-h-[44px]">
      {price ? (
        <>
          {price.discountRate > 0 ? (
            <div className="flex items-center gap-1.5">
              <span style={{ color: tokens.color.text.sale, fontWeight: 700 }}>
                {price.discountRate}%
              </span>
              <span
                className="line-through"
                style={{
                  color: tokens.color.text.tertiary,
                  fontSize: tokens.text["caption-relaxed-regular"].size,
                }}
              >
                {won(price.originalPrice)}
              </span>
            </div>
          ) : null}
          <div style={{ color: tokens.color.text.default, fontWeight: 700 }}>
            {won(price.discountPrice)}
          </div>
        </>
      ) : (
        <div
          className="h-[44px] w-24 animate-pulse rounded"
          style={{ backgroundColor: tokens.color.bg.muted }}
          aria-hidden
        />
      )}
    </div>
  );
}
