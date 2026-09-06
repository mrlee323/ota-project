import { tokens } from "@ds/design-system";

export interface CtaProps {
  label?: string;
  link?: string | { web_link?: string };
  style?: "primary" | "secondary";
}

const href = (link: CtaProps["link"]) =>
  typeof link === "string" ? link : link?.web_link;

/** 버튼 하나. 실사에서 가장 많이 나온 블록이다 (6/6 · 31회). */
export function Cta({ label, link, style = "primary" }: CtaProps) {
  const to = href(link);
  if (!label || !to) return null;

  const primary = style === "primary";

  return (
    <div className="px-4 py-4">
      <div className="mx-auto" style={{ maxWidth: tokens.layout["content-max"] }}>
        <a
          href={to}
          className="block w-full rounded-lg py-3.5 text-center font-bold"
          style={{
            backgroundColor: primary ? tokens.color.action.primary : tokens.color.bg.default,
            color: primary ? tokens.color.text.inverse : tokens.color.text.default,
            border: primary ? "none" : `1px solid ${tokens.color.border.default}`,
          }}
        >
          {label}
        </a>
      </div>
    </div>
  );
}
