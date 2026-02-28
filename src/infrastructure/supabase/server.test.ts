import { describe, it, expect, vi, beforeEach } from "vitest";

// 모듈 모킹 설정
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("./env", () => ({
  validateSupabaseEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  })),
}));

import { createClient } from "./server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateSupabaseEnv } from "./env";

describe("서버용 Supabase 클라이언트 팩토리", () => {
  const mockCookieStore = {
    getAll: vi.fn(() => [{ name: "sb-token", value: "abc123" }]),
    set: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never);
    vi.mocked(validateSupabaseEnv).mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    });
    vi.mocked(createServerClient).mockReturnValue({
      auth: {},
      from: vi.fn(),
    } as never);
  });

  it("createServerClient를 올바른 환경 변수로 호출한다", async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
  });

  it("validateSupabaseEnv를 호출하여 환경 변수를 검증한다", async () => {
    await createClient();

    expect(validateSupabaseEnv).toHaveBeenCalled();
  });

  it("cookies() API를 호출하여 쿠키 스토어를 가져온다", async () => {
    await createClient();

    expect(cookies).toHaveBeenCalled();
  });

  it("쿠키 핸들러의 getAll이 cookieStore.getAll을 호출한다", async () => {
    await createClient();

    // createServerClient에 전달된 cookies 옵션 추출
    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieHandler = callArgs[2].cookies as {
      getAll: () => Array<{ name: string; value: string }>;
    };

    const result = cookieHandler.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(result).toEqual([{ name: "sb-token", value: "abc123" }]);
  });

  it("쿠키 핸들러의 setAll이 cookieStore.set을 호출한다", async () => {
    await createClient();

    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieHandler = callArgs[2].cookies as {
      setAll: (
        cookies: Array<{
          name: string;
          value: string;
          options: Record<string, unknown>;
        }>,
      ) => void;
    };

    cookieHandler.setAll([
      { name: "sb-token", value: "new-value", options: { path: "/" } },
    ]);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "sb-token",
      "new-value",
      { path: "/" },
    );
  });

  it("setAll에서 cookieStore.set 실패 시 에러를 무시한다", async () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error("읽기 전용 컨텍스트에서 쿠키 설정 불가");
    });

    await createClient();

    const callArgs = vi.mocked(createServerClient).mock.calls[0];
    const cookieHandler = callArgs[2].cookies as {
      setAll: (
        cookies: Array<{
          name: string;
          value: string;
          options: Record<string, unknown>;
        }>,
      ) => void;
    };

    // 에러가 throw되지 않아야 한다
    expect(() =>
      cookieHandler.setAll([
        { name: "sb-token", value: "val", options: {} },
      ]),
    ).not.toThrow();
  });

  it("환경 변수 검증 실패 시 에러를 전파한다", async () => {
    vi.mocked(validateSupabaseEnv).mockImplementation(() => {
      throw new Error("환경 변수 검증 실패");
    });

    await expect(createClient()).rejects.toThrow("환경 변수 검증 실패");
  });

  it("매 호출마다 새 인스턴스를 생성한다 (싱글턴이 아님)", async () => {
    const mockClient1 = { id: 1, auth: {}, from: vi.fn() };
    const mockClient2 = { id: 2, auth: {}, from: vi.fn() };

    vi.mocked(createServerClient)
      .mockReturnValueOnce(mockClient1 as never)
      .mockReturnValueOnce(mockClient2 as never);

    const client1 = await createClient();
    const client2 = await createClient();

    expect(client1).not.toBe(client2);
  });
});
