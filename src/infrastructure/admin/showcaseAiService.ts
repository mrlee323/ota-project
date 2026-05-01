import Anthropic from "@anthropic-ai/sdk";

const FALLBACK_IMAGES: Record<string, string> = {
  교토: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
  제주: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&q=80",
  부산: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80",
  나트랑: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
  파리: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
  도쿄: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
  방콕: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80",
  발리: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80";

/**
 * Claude API를 사용해 쇼케이스 타이틀을 생성한다.
 * ANTHROPIC_API_KEY가 없으면 기본 타이틀로 폴백한다.
 */
export async function generateTitle(cityName: string, prompt?: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return prompt ? `${cityName} — ${prompt}` : `${cityName} 인기 호텔 모음`;
  }

  try {
    const client = new Anthropic();
    const userMessage = prompt
      ? `도시: ${cityName}\n키워드/분위기: ${prompt}\n위 정보를 바탕으로 숙박 앱의 쇼케이스 섹션 타이틀을 한 문장으로 작성해 주세요. 20자 이내, 감성적이고 임팩트 있게.`
      : `도시: ${cityName}\n위 도시의 숙박 앱 쇼케이스 타이틀을 한 문장으로 작성해 주세요. 20자 이내, 감성적이고 임팩트 있게.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("unexpected response type");

    return content.text.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error(`[showcaseAiService] generateTitle failed for ${cityName}:`, err);
    return prompt ? `${cityName} — ${prompt}` : `${cityName} 인기 호텔 모음`;
  }
}

/**
 * Unsplash API로 도시 이미지를 가져온다.
 * UNSPLASH_ACCESS_KEY가 없으면 미리 정의된 이미지로 폴백한다.
 */
export async function generateImage(cityName: string): Promise<string> {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    return FALLBACK_IMAGES[cityName] ?? DEFAULT_IMAGE;
  }

  try {
    const query = encodeURIComponent(`${cityName} hotel travel`);
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });

    if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);

    const data = (await res.json()) as {
      results: Array<{ urls: { regular: string } }>;
    };

    return data.results[0]?.urls.regular ?? (FALLBACK_IMAGES[cityName] ?? DEFAULT_IMAGE);
  } catch (err) {
    console.error(`[showcaseAiService] generateImage failed for ${cityName}:`, err);
    return FALLBACK_IMAGES[cityName] ?? DEFAULT_IMAGE;
  }
}
