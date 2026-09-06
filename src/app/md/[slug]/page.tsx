import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { getPublishedMdPage } from "@/infrastructure/md/mdPageApi";
import { getMdPageBySlug } from "@/infrastructure/md/mdAdminApi";
import { resolveMdPage } from "@/infrastructure/md/resolveMdPage";
import { MdPageRenderer } from "@/ui/patterns/md/MdPageRenderer";
import { MdTracker } from "@/ui/patterns/md/MdTracker";

// ─── 골격 / 변동 값 두 층 (docs/md/design.md §6) ─────────────────────────────
//
// Q1 에서 호텔 카드를 «id 참조» 로 정했다 → 가격은 조회 시점 값이어야 한다(FR-6.3).
// 그런데 NFR-1 은 LCP 2.5s 이고 기획전은 발송 직후 트래픽이 몰린다.
// 조회 시점 가격과 정적 캐시는 그냥은 양립하지 않는다.
//
//   골격(모듈 배열·텍스트·이미지·링크)  → 서버 컴포넌트 + ISR. 발행 시 revalidatePath
//   가격·재고                            → 카드 안쪽 클라이언트 컴포넌트가 채운다
//
// 렌더 전략(revalidate 값)은 나중에 한 줄로 바꿀 수 있지만,
// **컴포넌트 경계는 나중에 가르면 구조를 뒤집는 일**이라 P0 에서 정한다.
export const revalidate = 300;
export const dynamicParams = true;

/**
 * 빈 배열을 돌려주는 이유 — 빌드 시점에 미리 만들 페이지는 없지만,
 * `generateStaticParams` 가 아예 없으면 Next 가 이 라우트를 «매 요청 렌더» 로 본다.
 * 빈 배열 + dynamicParams=true 면 첫 요청에 생성하고 이후 revalidate 간격으로 재생성한다.
 */
export async function generateStaticParams() {
  return [];
}

type Params = { params: { slug: string } };

/**
 * Draft Mode 면 발행 여부·기간을 무시하고 저장된 그대로 보여준다.
 * 렌더러는 같은 것을 쓰므로 미리보기와 실제 화면이 갈라지지 않는다.
 */
async function loadPage(slug: string) {
  if ((await draftMode()).isEnabled) return getMdPageBySlug(slug);
  return getPublishedMdPage(slug);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const row = await loadPage(params.slug);
  if (!row) return {};
  return { title: row.title };
}

export default async function MdPublicPage({ params }: Params) {
  const row = await loadPage(params.slug);

  // 발행 전이거나 노출 기간 밖이면 존재하지 않는 페이지다 (FR-4.3)
  if (!row) notFound();

  const preview = (await draftMode()).isEnabled;

  // 골격 데이터는 서버에서 해석한다 — 캐시 대상이다
  const resolved = await resolveMdPage(row.page);

  return (
    <main>
      {/* 미리보기 조회는 성과 수치를 오염시키므로 세지 않는다 */}
      {preview ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-800">
          미리보기 — 아직 발행되지 않았습니다
        </div>
      ) : (
        <MdTracker pageId={row.id} />
      )}
      <MdPageRenderer page={row.page} resolved={resolved} />
    </main>
  );
}
