import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { validateSupabaseEnv } from "./infrastructure/supabase/env";

// 인증이 필요한 보호된 경로 목록
const PROTECTED_ROUTES = ["/mypage"];
// 인증된 사용자가 접근하면 홈으로 리다이렉트할 경로
const AUTH_ROUTES = ["/login"];

/**
 * 모든 요청에서 Supabase 세션을 갱신하고, 경로 보호를 수행한다.
 * 정적 자산 요청은 matcher 설정으로 제외한다.
 * 세션 갱신 실패 시 에러를 로깅하고 비인증 상태로 간주한다.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let isAuthenticated = false;

  try {
    const env = validateSupabaseEnv();

    // 미들웨어 전용 Supabase 서버 클라이언트 생성
    // request/response 쿠키를 직접 다루기 위해 인라인으로 생성한다
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // 세션 갱신 및 인증 상태 확인을 위해 getUser 호출
    const { data } = await supabase.auth.getUser();
    isAuthenticated = !!data.user;
  } catch (error) {
    // 세션 갱신 실패 시 비인증 상태로 간주하여 보호 경로 접근을 차단한다
    console.error("Supabase 세션 갱신 중 오류 발생:", error);
  }

  const { pathname } = request.nextUrl;

  // 비인증 사용자가 보호된 경로에 접근하면 /login으로 리다이렉트
  if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자가 로그인 페이지에 접근하면 홈으로 리다이렉트
  if (isAuthenticated && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

/** 미들웨어 적용 대상 경로 설정 - 정적 자산 및 이미지 파일 제외 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
