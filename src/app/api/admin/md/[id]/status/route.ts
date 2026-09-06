import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { getMdPageById, setMdStatus } from "@/infrastructure/md/mdAdminApi";
import { mdActionSchema, nextStatus, publishBlockers } from "@/domain/md/status";
import { MODULE_DEFS } from "@/domain/md/modules";

const schema = z.object({
  action: mdActionSchema,
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

/**
 * 발행 상태 전환.
 *
 * 전이 규칙과 발행 조건은 domain 이 정한다 — 여기서는 태우기만 한다.
 * 발행·발행취소는 공개 경로의 캐시를 즉시 무효화한다 (FR-6.5),
 * 안 그러면 발행하고도 최대 revalidate 간격만큼 안 보인다.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const access = await getFeatureAccess("md");
  if (!access.canWrite) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "요청이 올바르지 않습니다" }, { status: 400 });

  const row = await getMdPageById(params.id);
  if (!row) return NextResponse.json({ error: "찾을 수 없습니다" }, { status: 404 });

  const to = nextStatus(row.status, parsed.data.action);
  if (!to) {
    return NextResponse.json({ error: `${row.status} 상태에서 할 수 없는 동작입니다` }, { status: 409 });
  }

  const startsAt = parsed.data.startsAt !== undefined ? parsed.data.startsAt : row.startsAt;
  const endsAt = parsed.data.endsAt !== undefined ? parsed.data.endsAt : row.endsAt;

  if (to === "published") {
    // 발행은 저장보다 기준이 높다 — 사람이 보는 화면이 된다
    const blockers = publishBlockers({ page: row.page, startsAt, endsAt }, MODULE_DEFS);
    if (blockers.length > 0) {
      return NextResponse.json(
        { error: blockers.map((b) => b.reason).join(" · "), blockers },
        { status: 422 },
      );
    }
  }

  try {
    await setMdStatus(params.id, to, { startsAt, endsAt });
    revalidatePath(`/md/${row.slug}`);
    return NextResponse.json({ ok: true, status: to });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
