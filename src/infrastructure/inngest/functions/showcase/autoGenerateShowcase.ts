import { inngest } from "@/infrastructure/inngest/client";
import { createShowcaseContent } from "@/infrastructure/admin/showcaseContentApi";
import { getAutoConfig, updateAutoConfig } from "@/infrastructure/admin/autoConfigApi";
import { generateTitle, generateImage } from "@/infrastructure/admin/showcaseAiService";
import { resolveHotelsForCity } from "@/infrastructure/admin/showcaseHotelResolver";

function calcNextGenerationDate(intervalType: string, intervalValue: number): string {
  const d = new Date();
  switch (intervalType) {
    case "day":
      d.setDate(d.getDate() + intervalValue);
      break;
    case "week":
      d.setDate(d.getDate() + intervalValue * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + intervalValue);
      break;
  }
  d.setHours(15, 0, 0, 0); // 다음 실행도 00:00 KST (15:00 UTC)
  return d.toISOString();
}

/**
 * admin/showcase.generate-batch 이벤트 수신 시 실행.
 * 각 도시별로 step.run()을 병렬 실행해 AI 생성 → DB 저장한다.
 */
export const autoGenerateShowcase = inngest.createFunction(
  {
    id: "auto-generate-showcase",
    name: "쇼케이스 배치 자동 생성",
    retries: 2,
    triggers: [{ event: "admin/showcase.generate-batch" }],
  },
  async ({ event, step }) => {
    const { cities, startDate, endDate, prompt } = event.data as {
      cities: string[];
      startDate: string;
      endDate: string;
      prompt?: string;
      triggeredBy: "cron" | "manual";
    };

    // 도시별 병렬 생성
    const results = await Promise.all(
      cities.map((city: string) =>
        step.run(`generate-${city.replace(/\s+/g, "-")}`, async () => {
          try {
            const [title, imageUrl, hotels] = await Promise.all([
              generateTitle(city, prompt),
              generateImage(city, prompt),
              resolveHotelsForCity(city),
            ]);

            await createShowcaseContent({
              cityName: city,
              title,
              imageUrl,
              hotels,
              serviceEnabled: true,
              startDate,
              endDate,
            });

            return { city, success: true };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[autoGenerateShowcase] failed for ${city}:`, message);
            return { city, success: false, error: message };
          }
        }),
      ),
    );

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success).map((r) => r.city);

    // AutoConfig nextGenerationDate 업데이트
    const nextGenerationDate = await step.run("update-next-generation-date", async () => {
      const config = await getAutoConfig();
      const next = calcNextGenerationDate(config.intervalType, config.intervalValue);
      await updateAutoConfig({ nextGenerationDate: next });
      return next;
    });

    // 완료 이벤트 발송
    await step.sendEvent("notify-batch-completed", {
      name: "admin/showcase.batch-completed",
      data: {
        generatedCount: succeeded.length,
        failedCities: failed,
        nextGenerationDate,
      },
    });

    return {
      generatedCount: succeeded.length,
      failedCities: failed,
      nextGenerationDate,
    };
  },
);
