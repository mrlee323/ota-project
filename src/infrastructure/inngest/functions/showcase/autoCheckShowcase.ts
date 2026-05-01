import { inngest } from "@/infrastructure/inngest/client";
import { getAutoConfig } from "@/infrastructure/admin/autoConfigApi";

/**
 * 매일 00:00 KST (15:00 UTC) 실행.
 * AutoConfig를 조회해 자동 생성 조건이 충족되면 배치 이벤트를 발송한다.
 */
export const autoCheckShowcase = inngest.createFunction(
  {
    id: "auto-check-showcase",
    name: "쇼케이스 자동 생성 스케줄 확인",
    triggers: [{ cron: "0 15 * * *" }],
  },
  async ({ step }) => {
    const config = await step.run("fetch-auto-config", () => getAutoConfig());

    if (!config.enabled) {
      return { skipped: true, reason: "auto generation disabled" };
    }

    const now = new Date();
    const nextDate = new Date(config.nextGenerationDate);

    if (nextDate > now) {
      return {
        skipped: true,
        reason: "not yet scheduled",
        nextGenerationDate: config.nextGenerationDate,
      };
    }

    if (config.suggestedCities.length === 0) {
      return { skipped: true, reason: "no suggested cities configured" };
    }

    await step.sendEvent("trigger-batch-generation", {
      name: "admin/showcase.generate-batch",
      data: {
        cities: config.suggestedCities,
        startDate: config.contentStartDate,
        endDate: config.contentEndDate,
        triggeredBy: "cron" as const,
      },
    });

    return {
      triggered: true,
      cities: config.suggestedCities,
      startDate: config.contentStartDate,
      endDate: config.contentEndDate,
    };
  },
);
