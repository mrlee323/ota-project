import { inngest } from "@/infrastructure/inngest/client";
import { createServiceClient } from "@/infrastructure/supabase/serviceClient";
import { generateTitle, generateImage, generateHotels } from "@/infrastructure/admin/showcaseAiService";

/**
 * admin/showcase.regenerate-city 이벤트 수신 시 실행.
 * 단일 도시의 타이틀·이미지·호텔 목록을 AI로 재생성하고
 * 기존 DB 레코드가 있으면 업데이트, 없으면 신규 생성한다.
 */
export const autoRegenerateCity = inngest.createFunction(
  {
    id: "auto-regenerate-city",
    name: "쇼케이스 단일 도시 재생성",
    retries: 2,
    triggers: [{ event: "admin/showcase.regenerate-city" }],
  },
  async ({ event, step }) => {
    const { cityName, startDate, endDate, prompt } = event.data as {
      cityName: string;
      startDate: string;
      endDate: string;
      prompt?: string;
    };

    const [title, imageUrl, hotels] = await Promise.all([
      step.run("generate-title", () => generateTitle(cityName, prompt)),
      step.run("generate-image", () => generateImage(cityName, prompt)),
      step.run("generate-hotels", () => generateHotels(cityName, undefined, prompt)),
    ]);

    await step.run("upsert-showcase", async () => {
      const db = createServiceClient();

      // 같은 도시명으로 가장 최근 레코드를 조회해 업데이트, 없으면 신규 생성
      const { data: existing } = await db
        .from("showcase_content")
        .select("id")
        .eq("city_name", cityName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await db
          .from("showcase_content")
          .update({
            title,
            image_url: imageUrl,
            hotels,
            start_date: startDate,
            end_date: endDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await db.from("showcase_content").insert({
          city_name: cityName,
          title,
          image_url: imageUrl,
          hotels,
          service_enabled: true,
          start_date: startDate,
          end_date: endDate,
        });
      }
    });

    return { cityName, title, imageUrl };
  },
);
