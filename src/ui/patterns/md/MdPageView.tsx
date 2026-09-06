import { resolveMdPage } from "@/infrastructure/md/resolveMdPage";
import { MdPageRenderer } from "./MdPageRenderer";
import { MdTracker } from "./MdTracker";
import type { MdPage } from "@/domain/md/page";

/**
 * MD 한 장의 «화면 그 자체».
 *
 * 공개 라우트와 미리보기 라우트가 **이 컴포넌트를 공유한다.**
 * 라우트가 갈린 이유는 캐시 정책 때문이지 화면이 달라서가 아니다 —
 * 그래서 «미리보기에선 됐는데 발행하니 다르다» 가 생길 수 없다 (FR-3.4).
 *
 * 왜 한 라우트로 못 하나: draftMode() 는 쿠키를 읽고, 쿠키를 읽으면 Next 가
 * 그 페이지를 동적으로 판정한다. ISR(●)로 빌드된 페이지에서 그러면 런타임 에러다.
 */
export async function MdPageView({
  pageId,
  page,
  preview = false,
}: {
  pageId: string;
  page: MdPage;
  preview?: boolean;
}) {
  const resolved = await resolveMdPage(page);

  return (
    <main>
      {preview ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-800">
          미리보기 — 저장된 내용이며 아직 공개되지 않았을 수 있습니다
        </div>
      ) : (
        // 미리보기 조회는 성과 수치를 오염시키므로 세지 않는다
        <MdTracker pageId={pageId} />
      )}
      <MdPageRenderer page={page} resolved={resolved} />
    </main>
  );
}
