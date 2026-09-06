import { tokens, deriveTones, textOn } from "@ds/design-system";

export interface SectionTitleProps {
  title?: string;
  subtitle?: string;
  sectionBgColor?: string;
}

/**
 * 구간 제목.
 *
 * `sectionBgColor` 는 자유 입력이지만 **글자색은 자유가 아니다** —
 * 배경 명도로 자동 결정한다. 담당자가 색을 잘못 골라도 글자는 읽힌다
 * (packages/design-system tokens `$colorPolicy.textRule`).
 *
 * tone 파생도 여기서 한 번만 계산해 CSS 변수로 내려보낸다 — 모듈은 읽기만 한다.
 */
export function SectionTitle({ title, subtitle, sectionBgColor }: SectionTitleProps) {
  if (!title) return null;

  const bg = sectionBgColor ?? tokens.color.bg.default;
  const fg = sectionBgColor ? textOn(sectionBgColor) : tokens.color.text.default;
  const tones = sectionBgColor ? deriveTones(sectionBgColor) : null;

  return (
    <section
      style={{
        backgroundColor: bg,
        paddingBlock: tokens.layout["section-gap-mobile"],
        ...(tones
          ? ({
              "--md-tone-surface": tones.surface,
              "--md-tone-subtle": tones.subtle,
              "--md-tone-strong": tones.strong,
              "--md-tone-ink": tones.ink,
            } as React.CSSProperties)
          : {}),
      }}
    >
      <div className="mx-auto px-4" style={{ maxWidth: tokens.layout["content-max"] }}>
        <h2
          style={{
            color: fg,
            fontSize: tokens.text["heading-tight-bold"].size,
            lineHeight: tokens.text["heading-tight-bold"].lineHeight,
            fontWeight: tokens.text["heading-tight-bold"].weight,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className="mt-1"
            style={{ color: fg, opacity: 0.75, fontSize: tokens.text["body-relaxed-regular"].size }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
