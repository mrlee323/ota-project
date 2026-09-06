import { tokens } from "@ds/design-system";

export interface NotesProps {
  title?: string;
  items?: string[];
}

/**
 * 유의사항.
 *
 * **이미지로 만들지 않는다** — 법적 고지라 검색·복사가 돼야 한다 (FR-6.2 · NFR-3).
 * 실사에서 이것만이 유일하게 텍스트였던 이유이기도 하다 (F2).
 */
export function Notes({ title, items }: NotesProps) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <section
      style={{
        backgroundColor: tokens.color.bg.subtle,
        paddingBlock: tokens.layout["section-gap-mobile"],
      }}
    >
      <div className="mx-auto px-4" style={{ maxWidth: tokens.layout["content-max"] }}>
        <h2
          style={{
            color: tokens.color.text.secondary,
            fontSize: tokens.text["body-relaxed-bold"].size,
            fontWeight: tokens.text["body-relaxed-bold"].weight,
          }}
        >
          {title ?? "유의사항"}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {list.map((line, i) => (
            <li
              key={i}
              style={{
                color: tokens.color.text.tertiary,
                fontSize: tokens.text["caption-relaxed-regular"].size,
                lineHeight: tokens.text["caption-relaxed-regular"].lineHeight,
              }}
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
