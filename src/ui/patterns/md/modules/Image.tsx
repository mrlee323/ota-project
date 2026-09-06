import { tokens } from "@ds/design-system";

export interface ImageBlockProps {
  imageUrl?: string;
  alt?: string;
  link?: string | { web_link?: string };
}

const href = (link: ImageBlockProps["link"]) =>
  typeof link === "string" ? link : link?.web_link;

/**
 * 이미지 한 장.
 *
 * `alt` 를 필수로 받는다 (NFR-2) — 실사에서 호텔 이름조차 img[alt] 로만 존재했다.
 * 그 상태를 재생산하지 않으려면 최소한 대체 텍스트는 있어야 한다.
 */
export function ImageBlock({ imageUrl, alt, link }: ImageBlockProps) {
  if (!imageUrl) return null;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- 담당자가 넣는 임의 외부 URL 이라 next/image 로 최적화할 수 없다
    <img
      src={imageUrl}
      alt={alt ?? ""}
      className="mx-auto block w-full"
      style={{ maxWidth: tokens.layout["content-max"], backgroundColor: tokens.color.bg.muted }}
    />
  );

  const to = href(link);
  return to ? <a href={to}>{img}</a> : img;
}
