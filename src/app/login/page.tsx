import { Card, CardContent } from "@/ui/components/Card";
import { Input } from "@/ui/components/Input";
import { loginAction } from "@/application/auth/actions";
import { SubmitButton } from "@/ui/components/SubmitButton";

/**
 * 로그인/회원가입 페이지 (Server Component)
 * searchParams에서 에러 메시지를 읽어 표시하고,
 * Server Action을 form action으로 바인딩한다.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-400 via-purple-600 to-brand-500 px-4">
      {/* 로고 */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
          <span className="text-lg font-black text-white">T</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">OTA</span>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              여행의 시작, 로그인
            </h1>
            <p className="text-sm text-gray-500">
              이메일로 로그인하거나 새 계정을 만드세요
            </p>
          </div>

          {/* URL 쿼리 파라미터 에러 메시지 표시 */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 로그인 폼 */}
          <form action={loginAction} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="이메일"
              placeholder="이메일을 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <Input
              name="password"
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex flex-col gap-3 pt-2">
              <SubmitButton
                formAction={loginAction}
                variant="primary"
                size="lg"
                className="w-full rounded-lg"
              >
                로그인
              </SubmitButton>
              <p className="text-center text-sm text-gray-500">
                계정이 없으신가요?{" "}
                <a href="/signup" className="font-medium text-purple-600 hover:text-purple-700">
                  회원가입
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-white/60">
        국내외 최저가 호텔을 트립비토즈에서 찾아보세요
      </p>
    </div>
  );
}
