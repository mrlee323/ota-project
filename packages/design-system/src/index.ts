/**
 * 디자인시스템 공개 진입점.
 *
 * `src/` 는 이 파일이 내보내는 것만 쓴다 — 내부 경로 직접 import 는 lint 로 막는다.
 * 레지스트리 배포를 하지 않는 대신 이 경계가 그 역할을 한다 (docs/md/design.md D8).
 */
import tokens from "../tokens/md.json";

export { tokens };

export type ToneStep = "surface" | "subtle" | "base" | "strong" | "ink";

/** #rgb / #rrggbb → [r,g,b] */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = (rgb: number[]) => "#" + rgb.map((c) => clamp255(c).toString(16).padStart(2, "0")).join("");

/**
 * 자유 입력 배경색에서 tone 단계를 파생한다.
 *
 * 담당자가 색 하나만 고르면 나머지가 자동으로 정해져, 한 페이지 안에서 색이 따로 놀지 않는다.
 * 계산은 여기 한 곳에서만 한다 — 모듈 CSS 는 `--md-tone-*` 를 읽기만 한다.
 */
export function deriveTones(baseHex: string): Record<ToneStep, string> {
  const base = parseHex(baseHex);
  const mix = (target: number, pct: number) =>
    toHex(base.map((c) => c + (target - c) * (pct / 100)));

  const spec = tokens.tone as Record<string, { mix?: string; pct?: number }>;
  const out = {} as Record<ToneStep, string>;
  for (const step of ["surface", "subtle", "base", "strong", "ink"] as ToneStep[]) {
    const s = spec[step];
    out[step] = s?.mix === "white" ? mix(255, s.pct ?? 0) : mix(0, s?.pct ?? 0);
  }
  return out;
}

/**
 * 배경 명도로 글자색을 고른다 (`$colorPolicy.textRule`).
 * 자유 입력이 접근성을 깨지 않게 하는 장치다 — 담당자가 색을 잘못 골라도 글자는 읽힌다.
 */
export function textOn(bgHex: string): string {
  const [r, g, b] = parseHex(bgHex);
  // WCAG 상대 휘도 근사
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? tokens.color.text.default : tokens.color.text.inverse;
}
