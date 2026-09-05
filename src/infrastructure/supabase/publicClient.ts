import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * 공개 읽기 전용 Supabase 클라이언트 — **쿠키를 읽지 않는다.**
 *
 * `server.ts` 의 클라이언트는 세션 쿠키를 읽으므로, 그걸 쓰는 페이지는
 * Next 가 무조건 동적 렌더로 판정한다 (`revalidate` 가 무시된다).
 * 공개 MD 페이지는 세션이 필요 없으므로 이 클라이언트를 써서 ISR 을 살린다
 * (docs/md/design.md §6 — 골격은 캐시 가능해야 한다).
 *
 * RLS 의 `md_pages_public_read` 정책이 발행·기간을 한 번 더 거른다.
 */
export function createPublicClient(): SupabaseClient {
  if (client) return client;

  const env = validateSupabaseEnv();
  client = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
