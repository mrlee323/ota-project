import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseEnv } from "./env";

/**
 * 서버 컴포넌트 / Server Action / Route Handler에서 사용할
 * Supabase 클라이언트를 생성한다.
 * 매 요청마다 새 인스턴스를 생성하여 요청 간 상태 격리를 보장한다.
 */
export async function createClient(): Promise<SupabaseClient> {
  const env = validateSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서 쿠키 설정이 불가능한 경우 (읽기 전용 컨텍스트)
            // 에러를 무시한다. 미들웨어에서 세션 갱신을 처리한다.
          }
        },
      },
    },
  );
}
