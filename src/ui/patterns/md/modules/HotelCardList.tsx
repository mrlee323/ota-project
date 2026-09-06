import { tokens } from "@ds/design-system";
import type { HotelCardBase } from "@/infrastructure/md/hotelLookup";
import { HotelPrice } from "./HotelPrice";

export interface HotelCardListProps {
  /** 저장되는 값 — 호텔 id 만 (Q1) */
  hotelRefs?: string[];
  layout?: "grid" | "carousel";
  /** resolveMdPage 가 채워 넣는 골격 데이터 (design.md §6) */
  hotels?: HotelCardBase[];
}

/**
 * 호텔 카드 목록 — **데이터를 받아 그리기만 한다.**
 *
 * async 서버 컴포넌트로 만들면 어드민 캔버스(클라이언트)에서 같은 컴포넌트를 못 쓰고,
 * 그러면 미리보기용 렌더러를 따로 만들게 된다 — 그 순간 FR-3.4 가 깨진다.
 * 호텔 조회는 `resolveMdPage` 가 맡는다.
 *
 * 골격(이름·사진·지역·등급)은 여기서 그리고 가격은 클라이언트 자식이 채운다 —
 * 그 경계 덕분에 페이지를 ISR 로 캐시하면서도 가격은 최신이다.
 */
export function HotelCardList({ layout = "grid", hotels = [] }: HotelCardListProps) {
  // 저장된 호텔이 전부 사라졌으면 이 블록만 빠진다. 페이지는 뜬다
  if (hotels.length === 0) return null;

  const container =
    layout === "carousel"
      ? "flex gap-4 overflow-x-auto pb-2 snap-x"
      : "grid grid-cols-2 gap-4 md:grid-cols-4";

  return (
    <section
      style={{
        paddingBlock: tokens.layout["section-gap-mobile"],
        backgroundColor: tokens.color.bg.default,
      }}
    >
      <div
        className="mx-auto px-4"
        style={{ maxWidth: tokens.layout["content-max"] }}
      >
        <ul className={container}>
          {hotels.map((h) => (
            <li
              key={h.id}
              className={layout === "carousel" ? "w-[220px] shrink-0 snap-start" : undefined}
            >
              <a href={`/hotel/${h.id}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element -- 호텔 썸네일은 외부 CDN URL 이라 next/image 최적화 대상이 아니다 */}
                <img
                  src={h.thumbnailUrl}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                  style={{ backgroundColor: tokens.color.bg.muted }}
                />
                <div className="mt-2">
                  <p
                    className="line-clamp-1 font-bold"
                    style={{ color: tokens.color.text.default }}
                  >
                    {h.name}
                  </p>
                  <p
                    style={{
                      color: tokens.color.text.tertiary,
                      fontSize: tokens.text["caption-relaxed-regular"].size,
                    }}
                  >
                    {h.location} · {h.stars}성급
                  </p>
                  {/* 변동 값 층 — 클라이언트가 채운다 */}
                  <HotelPrice hotelId={h.id} />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
