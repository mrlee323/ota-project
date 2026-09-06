import { ImageResponse } from "next/og";
import { getPublishedMdPage } from "@/infrastructure/md/mdPageApi";

// ─── 팬아웃 · OG 이미지 (FR-7.1) ────────────────────────────────────────────
//
// 실사에서 «MD 는 하나가 아니다» 라는 게 드러났다 — 본문 하나에 부산물이 여럿 붙는다.
// 그중 가장 확실하게 필요한 것 하나만 자동화한다.
//
// hero 블록의 값에서 만든다. 이미지를 새로 «생성» 하지 않는다 —
// 팬아웃은 이미 있는 값을 다른 모양으로 내보내는 일이지 창작이 아니다.

export const runtime = "nodejs";
export const alt = "기획전";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const row = await getPublishedMdPage(params.slug);
  const hero = row?.page.blocks.find((b) => b.moduleType === "hero");

  const title = (hero?.values.title as string) ?? row?.title ?? "기획전";
  const subtitle = (hero?.values.subtitle as string) ?? "";
  const period = (hero?.values.period as string) ?? "";
  const bg = hero?.values.imageUrl as string | undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 64,
          backgroundColor: "#111827",
          backgroundImage: bg ? `url(${bg})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 배경 사진 위에서도 글자가 읽히게 어둡게 덮는다 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.25))",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, zIndex: 1 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.15 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,.88)" }}>{subtitle}</div>
          ) : null}
          {period ? (
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.68)" }}>{period}</div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}
