import { describe, it, expect } from "vitest";
import { fetchActiveCelebBanners, fetchCelebCampaign, fetchCeleb } from "./api";
import { mockCelebBanners, mockCampaigns, mockCelebs } from "@/__mocks__/celeb";

describe("infrastructure/celeb/api", () => {
  // ─── fetchActiveCelebBanners ────────────────────────────────────────────────

  describe("fetchActiveCelebBanners", () => {
    it("활성 배너 목록을 반환한다", async () => {
      const banners = await fetchActiveCelebBanners();

      expect(banners).toEqual(mockCelebBanners);
      expect(banners.length).toBeGreaterThanOrEqual(1);
    });

    it("각 배너에 필수 필드가 포함되어 있다", async () => {
      const banners = await fetchActiveCelebBanners();

      for (const banner of banners) {
        expect(banner.campaignId).toBeTruthy();
        expect(banner.celeb).toBeDefined();
        expect(banner.celeb.name).toBeTruthy();
        expect(banner.hotelName).toBeTruthy();
        expect(banner.discountRate).toBeGreaterThan(0);
      }
    });
  });

  // ─── fetchCelebCampaign ─────────────────────────────────────────────────────

  describe("fetchCelebCampaign", () => {
    it("존재하는 셀럽+호텔 조합이면 캠페인을 반환한다", async () => {
      const campaign = await fetchCelebCampaign("celeb-1", "1");

      expect(campaign).toEqual(mockCampaigns[0]);
    });

    it("존재하지 않는 조합이면 null을 반환한다", async () => {
      const campaign = await fetchCelebCampaign("celeb-999", "999");

      expect(campaign).toBeNull();
    });

    it("셀럽 ID만 일치하고 호텔 ID가 다르면 null을 반환한다", async () => {
      const campaign = await fetchCelebCampaign("celeb-1", "999");

      expect(campaign).toBeNull();
    });
  });

  // ─── fetchCeleb ─────────────────────────────────────────────────────────────

  describe("fetchCeleb", () => {
    it("존재하는 셀럽 ID면 셀럽 정보를 반환한다", async () => {
      const celeb = await fetchCeleb("celeb-1");

      expect(celeb).toEqual(mockCelebs[0]);
    });

    it("존재하지 않는 셀럽 ID면 null을 반환한다", async () => {
      const celeb = await fetchCeleb("nonexistent");

      expect(celeb).toBeNull();
    });
  });
});
