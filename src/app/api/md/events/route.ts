import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { recordMdEvent } from "@/infrastructure/md/mdEventApi";

const schema = z.object({
  pageId: z.string().uuid(),
  blockId: z.string().max(64).optional(),
  moduleType: z.string().max(64).optional(),
  event: z.enum(["view", "click"]),
});

/** 공개 페이지의 조회·클릭 적재. 캐시하지 않는다. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  // 잘못된 요청도 조용히 200 — 측정 때문에 화면이 시끄러워지면 안 된다
  if (!parsed.success) return NextResponse.json({ ok: true });

  await recordMdEvent(parsed.data);
  return NextResponse.json({ ok: true });
}
