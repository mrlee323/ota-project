import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedMdPage } from "@/infrastructure/md/mdPageApi";
import { MdPageView } from "@/ui/patterns/md/MdPageView";

// ─── 골격 / 변동 값 두 층 (docs/md/design.md §6) ─────────────────────────────
//
// Q1 에서 호텔 카드를 «id 참조» 로 정했다 → 가격은 조회 시점 값이어야 한다(FR-6.3).
// 그런데 NFR-1 은 LCP 2.5s 이고 기획전은 발송 직후 트래픽이 몰린다.
//
//   골격(모듈 배열·텍스트·이미지·링크)  → 여기. 서버 렌더 + ISR
//   가격·재고                            → 카드 안쪽 클라이언트 컴포넌트
//
// **이 파일은 쿠키를 읽지 않는다.** 읽는 순간 Next 가 동적으로 판정해
// ISR 이 깨지고 런타임 에러가 난다 — 미리보기가 별도 라우트인 이유다.
export const revalidate = 300;
export const dynamicParams = true;

/**
 * 빈 배열을 돌려주는 이유 — 빌드 시점에 미리 만들 페이지는 없지만,
 * `generateStaticParams` 가 아예 없으면 Next 가 이 라우트를 «매 요청 렌더» 로 본다.
 */
export async function generateStaticParams() {
  return [];
}

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const row = await getPublishedMdPage(params.slug);
  return row ? { title: row.title } : {};
}

export default async function MdPublicPage({ params }: Params) {
  const row = await getPublishedMdPage(params.slug);

  // 발행 전이거나 노출 기간 밖이면 존재하지 않는 페이지다 (FR-4.3)
  if (!row) notFound();

  return <MdPageView pageId={row.id} page={row.page} />;
}
