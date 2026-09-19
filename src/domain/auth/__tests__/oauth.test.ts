import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  authorizationServerMetadata,
  isRegisteredRedirect,
  protectedResourceMetadata,
  timingSafeEqual,
  validateRedirectUri,
  verifyPkce,
} from "../oauth";

const s256 = (s: string) => createHash("sha256").update(s).digest("base64url");

describe("돌려줄 주소", () => {
  it("https 는 받는다", () => {
    expect(validateRedirectUri("https://chatgpt.com/connector_platform_oauth_redirect")).toBe(true);
  });

  it("http 는 루프백만 받는다 — 평문으로 코드가 오가면 안 된다", () => {
    expect(validateRedirectUri("http://127.0.0.1:1455/callback")).toBe(true);
    expect(validateRedirectUri("http://localhost:3000/cb")).toBe(true);
    expect(validateRedirectUri("http://evil.com/cb")).toBe(false);
  });

  it("조각이 붙은 주소는 받지 않는다", () => {
    expect(validateRedirectUri("https://ok.com/cb#frag")).toBe(false);
  });

  it("주소 모양이 아니면 받지 않는다", () => {
    expect(validateRedirectUri("not-a-url")).toBe(false);
    expect(validateRedirectUri("")).toBe(false);
  });

  it("등록된 주소와 «정확히» 같아야 한다", () => {
    const registered = ["https://good.example.com/cb"];
    expect(isRegisteredRedirect("https://good.example.com/cb", registered)).toBe(true);
    // 접두사 비교였다면 통과했을 주소들
    expect(isRegisteredRedirect("https://good.example.com.evil.com/cb", registered)).toBe(false);
    expect(isRegisteredRedirect("https://good.example.com/cb/extra", registered)).toBe(false);
    expect(isRegisteredRedirect("https://good.example.com/cb?x=1", registered)).toBe(false);
  });
});

describe("PKCE", () => {
  const verifier = "a".repeat(64);

  it("맞는 verifier 면 통과한다", () => {
    expect(verifyPkce(verifier, s256(verifier), s256)).toBe(true);
  });

  it("틀린 verifier 는 막는다 — 코드를 가로채도 교환하지 못한다", () => {
    expect(verifyPkce("b".repeat(64), s256(verifier), s256)).toBe(false);
  });

  it("너무 짧거나 긴 verifier 는 받지 않는다 (RFC 7636 43~128)", () => {
    expect(verifyPkce("a".repeat(42), s256("a".repeat(42)), s256)).toBe(false);
    expect(verifyPkce("a".repeat(129), s256("a".repeat(129)), s256)).toBe(false);
  });

  it("비어 있으면 통과시키지 않는다", () => {
    expect(verifyPkce("", "", s256)).toBe(false);
    expect(verifyPkce(verifier, "", s256)).toBe(false);
  });

  it("길이가 달라도 비교가 무너지지 않는다", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });
});

describe("디스커버리 문서", () => {
  const origin = "https://ota-project.vercel.app";

  it("보호 자원은 /api/mcp 이고 인가 서버는 자기 자신이다", () => {
    const m = protectedResourceMetadata(origin);
    expect(m.resource).toBe(`${origin}/api/mcp`);
    expect(m.authorization_servers).toEqual([origin]);
  });

  it("PKCE 는 S256 만 광고한다 — plain 이 있으면 클라이언트가 그걸 고른다", () => {
    const m = authorizationServerMetadata(origin);
    expect(m.code_challenge_methods_supported).toEqual(["S256"]);
  });

  it("엔드포인트 주소가 실제 라우트와 맞는다", () => {
    const m = authorizationServerMetadata(origin);
    expect(m.authorization_endpoint).toBe(`${origin}/oauth/authorize`);
    expect(m.token_endpoint).toBe(`${origin}/api/oauth/token`);
    expect(m.registration_endpoint).toBe(`${origin}/api/oauth/register`);
  });

  it("공개 클라이언트뿐이라 client_secret 을 요구하지 않는다", () => {
    expect(authorizationServerMetadata(origin).token_endpoint_auth_methods_supported).toEqual([
      "none",
    ]);
  });
});

describe("수명", () => {
  it("refresh 는 30일이다 — 짧으면 대화 도중 끊긴다 (plan.md §9)", () => {
    expect(REFRESH_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("access 는 refresh 보다 훨씬 짧다", () => {
    expect(ACCESS_TTL_MS).toBeLessThan(REFRESH_TTL_MS);
  });
});
