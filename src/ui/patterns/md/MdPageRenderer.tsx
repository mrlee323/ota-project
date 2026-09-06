import type { MdPage } from "@/domain/md/page";
import { MODULE_REGISTRY } from "./registry";

/**
 * 페이지 JSON → 화면.
 *
 * **모듈이 100개가 돼도 이 파일은 바뀌지 않는다.** 하는 일은 registry 조회와 순회뿐이다.
 * 서비스는 MD 를 위한 코드를 따로 짜지 않는다 (design.md §6).
 */
export function MdPageRenderer({
  page,
  resolved = {},
}: {
  page: MdPage;
  /** 블록이 그리는 데 필요한 바깥 데이터 (resolveMdPage 의 결과) */
  resolved?: Record<string, Record<string, unknown>>;
}) {
  return (
    <>
      {page.blocks.map((b) => {
        const C = MODULE_REGISTRY[b.moduleType];
        // D5 — 모르는 타입은 «스킵» 한다. 던지지 않는다.
        // 어드민이 새 모듈로 저장한 페이지를 아직 배포 안 된 렌더러가 열어도
        // 나머지 블록은 보여야 한다 (AC-6).
        if (!C) return null;
        // display: contents 라 레이아웃에 영향을 주지 않으면서 블록 경계를 남긴다.
        // 클릭 추적이 «어느 블록» 인지 알아야 모듈 종류별 성과를 낼 수 있다 (FR-8.2)
        return (
          <div key={b.id} style={{ display: "contents" }} data-md-block={b.id} data-md-module={b.moduleType}>
            <C {...b.values} {...(resolved[b.id] ?? {})} />
          </div>
        );
      })}
    </>
  );
}
