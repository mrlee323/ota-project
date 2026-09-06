import { NextResponse, type NextRequest } from "next/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { mdRequestSchema } from "@/domain/md/request";
import { SYSTEM_TEMPLATES } from "@/domain/md/template";
import { generateFromRequest } from "@/infrastructure/md/mdAiService";
import { isLlmConfigured } from "@/infrastructure/md/llmClient";

/**
 * 요청서 → MD 초안 (L1).
 *
 * 결과는 **저장하지 않고 돌려준다** — 캔버스가 받아 얹고, 담당자가 보고 저장한다.
 * 자동 저장하면 «AI 가 만든 것» 과 «사람이 고친 것» 이 섞여 되돌릴 수 없다.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const access = await getFeatureAccess("md");
  if (!access.canWrite) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  if (!isLlmConfigured()) {
    return NextResponse.json(
      { error: "LLM 설정이 없습니다. .env.local 의 LLM_EXTRACT_* 를 채우세요." },
      { status: 503 },
    );
  }

  const parsed = mdRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "요청서 형식이 올바르지 않습니다" }, { status: 400 });
  }

  const template = SYSTEM_TEMPLATES.find((t) => t.id === parsed.data.templateId);
  if (!template) return NextResponse.json({ error: "없는 템플릿입니다" }, { status: 400 });

  try {
    const result = await generateFromRequest(parsed.data, template);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
