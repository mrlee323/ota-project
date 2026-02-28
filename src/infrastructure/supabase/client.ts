import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseEnv } from "./env";

/** 브라우저용 Supabase 클라이언트 싱글턴 인스턴스 */
let client: SupabaseClient | null = null;

/**
 * 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트를 생성한다.
 * 싱글턴 패턴으로 동일한 인스턴스를 재사용한다.
 */
export function createClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const env = validateSupabaseEnv();

  client = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return client;
}
