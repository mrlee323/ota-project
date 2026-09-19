/**
 * MCP 용 OAuth 2.1 의 «판단» 부분.
 *
 * DB 도 요청도 모르는 순수 함수만 둔다 — 인가 서버에서 틀리면 안 되는 것은
 * 전부 여기서 결정하고 테스트로 고정한다. 배관은 infrastructure 에 있다.
 */

/** 인가 코드 수명. 짧아야 한다 — 받자마자 교환하는 값이다 */
export const CODE_TTL_MS = 10 * 60 * 1000;

/** access 토큰 수명. 만료되면 refresh 로 갱신한다 */
export const ACCESS_TTL_MS = 60 * 60 * 1000;

/**
 * refresh 토큰 수명 — **30일**.
 *
 * 짧게 잡으면 대화 도중 만료돼 다시 로그인하게 된다. 회사 서비스에서
 * 그 문제를 겪고 30일로 정착했다 (docs/md/plan.md §9).
 */
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 이 서버가 내주는 권한. MCP 는 초안까지만 만든다 */
export const SCOPE = "md:draft";

export interface ClientRegistration {
  clientName: string;
  redirectUris: string[];
}

/**
 * 동적 등록 요청을 받아들일지 정한다.
 *
 * `http` 는 루프백만 허용한다 — 데스크톱 클라이언트가 `http://127.0.0.1:1234/cb`
 * 를 쓰기 때문이다. 그 외에는 https 만 받는다. 코드가 흘러가는 주소라
 * 여기서 느슨하면 뒤에서 아무리 조여도 소용이 없다.
 */
export function validateRedirectUri(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }

  // 조각(fragment)이 붙은 주소로는 되돌려 줄 수 없다
  if (url.hash) return false;

  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") return url.hostname === "127.0.0.1" || url.hostname === "localhost";

  // 커스텀 스킴(예: cursor://)은 호스트가 있어야 한다
  return url.protocol.endsWith(":") && url.protocol.length > 2 && Boolean(url.href.split("//")[1]);
}

/**
 * 돌려줄 주소가 등록된 것과 **정확히 같은지** 본다.
 *
 * 접두사 비교로 느슨하게 하면 `https://good.example.com.evil.com` 같은 주소로
 * 코드가 새어 나간다. 문자열이 같지 않으면 거절한다.
 */
export function isRegisteredRedirect(uri: string, registered: string[]): boolean {
  return registered.includes(uri);
}

/**
 * PKCE 검증 (RFC 7636 S256).
 *
 * 공개 클라이언트뿐이라 client_secret 이 없다 — 코드를 가로챈 쪽이
 * 그대로 교환하는 것을 막는 수단이 이것뿐이다. 그래서 plain 은 받지 않는다.
 */
export function verifyPkce(verifier: string, challenge: string, sha256Base64Url: (s: string) => string): boolean {
  if (!verifier || !challenge) return false;
  // RFC 7636 §4.1 — 43~128자
  if (verifier.length < 43 || verifier.length > 128) return false;
  return timingSafeEqual(sha256Base64Url(verifier), challenge);
}

/** 길이가 달라도 도중에 빠져나가지 않는다 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
}

/** RFC 9728 — 401 이 가리키는 그 문서 */
export function protectedResourceMetadata(origin: string): ProtectedResourceMetadata {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
  };
}

export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
}

/** RFC 8414 — 클라이언트가 «어디로 보내야 하나» 를 읽는 문서 */
export function authorizationServerMetadata(origin: string): AuthorizationServerMetadata {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    scopes_supported: [SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    // plain 은 넣지 않는다 — 있으면 클라이언트가 그걸 고를 수 있다
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  };
}
