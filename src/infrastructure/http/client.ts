const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** 동적 헤더를 반환하는 제공자 함수 타입 */
type HeaderProvider = () => Record<string, string>;

/** 등록된 헤더 제공자 목록 */
const headerProviders: HeaderProvider[] = [];

/** 동적 헤더 제공자를 등록한다 (앱 초기화 시 호출) */
export function registerHeaderProvider(provider: HeaderProvider): void {
  headerProviders.push(provider);
}

/** 등록된 모든 제공자에서 헤더를 수집한다 */
function collectHeaders(): Record<string, string> {
  return headerProviders.reduce<Record<string, string>>(
    (acc, provider) => ({ ...acc, ...provider() }),
    {},
  );
}

/** 공통 HTTP 클라이언트 — 모든 API 요청에 공유 헤더를 자동 주입한다 */
export async function httpClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const dynamicHeaders = collectHeaders();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...dynamicHeaders,
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}
