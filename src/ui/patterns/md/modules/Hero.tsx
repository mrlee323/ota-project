import { tokens } from "@ds/design-system";

export interface HeroProps {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  period?: string;
}

/**
 * 히어로 — 기획전 최상단.
 *
 * 텍스트는 이미지가 아니라 DOM 에 둔다 (NFR-3) — 실사 F1 의 문제를 재생산하지 않는다.
 * 값이 없으면 그 요소만 빠지고 레이아웃은 유지된다 (요구사항 §8 실패 모드).
 */
export function Hero({ imageUrl, title, subtitle, period }: HeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: tokens.color.bg.muted }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 담당자가 넣는 임의 외부 URL 이라 next/image 로 최적화할 수 없다
        <img
          src={imageUrl}
          alt=""
          className="h-[320px] w-full object-cover md:h-[420px]"
        />
      ) : (
        <div className="h-[320px] w-full md:h-[420px]" aria-hidden />
      )}

      <div
        className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
        style={{ background: tokens.color.overlay["dark-30"] }}
      >
        <div className="mx-auto w-full" style={{ maxWidth: tokens.layout["content-max"] }}>
          {title ? (
            <h1
              className="font-bold"
              style={{
                color: tokens.color.text.inverse,
                fontSize: tokens.text["display-tight-bold"].size,
                lineHeight: tokens.text["display-tight-bold"].lineHeight,
              }}
            >
              {title}
            </h1>
          ) : null}

          {subtitle ? (
            <p
              className="mt-2"
              style={{
                color: tokens.color.text.inverse,
                fontSize: tokens.text["body-relaxed-regular"].size,
              }}
            >
              {subtitle}
            </p>
          ) : null}

          {period ? (
            <p
              className="mt-1"
              style={{
                color: tokens.color.text.inverse,
                fontSize: tokens.text["caption-relaxed-regular"].size,
                opacity: 0.9,
              }}
            >
              {period}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
