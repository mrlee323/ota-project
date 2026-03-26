import { describe, it, expect } from "vitest";
import { resolveGroupBuyCelebId } from "./useGroupBuyInit";

describe("resolveGroupBuyCelebId", () => {
  describe("utm_source=celeb인 경우", () => {
    it("유효한 celeb_id가 있으면 해당 ID를 반환하고 저장 플래그를 설정한다", () => {
      const result = resolveGroupBuyCelebId("celeb", "celeb-123", null);

      expect(result.celebId).toBe("celeb-123");
      expect(result.shouldStore).toBe(true);
    });

    it("celeb_id가 null이면 celebId를 null로 반환한다", () => {
      const result = resolveGroupBuyCelebId("celeb", null, null);

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });

    it("celeb_id가 빈 문자열이면 celebId를 null로 반환한다", () => {
      const result = resolveGroupBuyCelebId("celeb", "", null);

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });

    it("celeb_id가 공백만 있으면 celebId를 null로 반환한다", () => {
      const result = resolveGroupBuyCelebId("celeb", "   ", null);

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });

    it("유효한 celeb_id가 있으면 storedCelebId를 무시한다", () => {
      const result = resolveGroupBuyCelebId(
        "celeb",
        "new-celeb",
        "old-stored",
      );

      expect(result.celebId).toBe("new-celeb");
      expect(result.shouldStore).toBe(true);
    });

    it("celeb_id 앞뒤 공백을 trim한 값을 반환한다", () => {
      const result = resolveGroupBuyCelebId("celeb", "  celeb-456  ", null);

      expect(result.celebId).toBe("celeb-456");
      expect(result.shouldStore).toBe(true);
    });
  });

  describe("utm_source가 celeb이 아닌 경우", () => {
    it("sessionStorage에 유효한 값이 있으면 복원한다", () => {
      const result = resolveGroupBuyCelebId(null, null, "stored-celeb-789");

      expect(result.celebId).toBe("stored-celeb-789");
      expect(result.shouldStore).toBe(false);
    });

    it("sessionStorage가 비어있으면 null을 반환한다", () => {
      const result = resolveGroupBuyCelebId(null, null, null);

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });

    it("sessionStorage에 빈 문자열이 있으면 null을 반환한다", () => {
      const result = resolveGroupBuyCelebId(null, null, "");

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });

    it("utm_source가 다른 값이어도 sessionStorage에서 복원한다", () => {
      const result = resolveGroupBuyCelebId(
        "google",
        null,
        "stored-celeb-abc",
      );

      expect(result.celebId).toBe("stored-celeb-abc");
      expect(result.shouldStore).toBe(false);
    });

    it("sessionStorage에 공백만 있으면 null을 반환한다", () => {
      const result = resolveGroupBuyCelebId("naver", null, "   ");

      expect(result.celebId).toBeNull();
      expect(result.shouldStore).toBe(false);
    });
  });
});
