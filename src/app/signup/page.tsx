import { Card, CardContent } from "@/ui/components/Card";
import { Input } from "@/ui/components/Input";
import { signupAction } from "@/application/auth/actions";
import { SubmitButton } from "@/ui/components/SubmitButton";

/**
 * 회원가입 페이지 (Server Component)
 * 비밀번호 확인, 약관 동의를 포함한 회원가입 전용 폼.
 * searchParams에서 에러 메시지를 읽어 표시한다.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-400 via-purple-500 to-brand-500 px-4">
      {/* 로고 */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
          <span className="text-lg font-black text-white">T</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-purple-700">OTA</span>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              새로운 여행을 시작하세요
            </h1>
            <p className="text-sm text-gray-500">
              간단한 정보만으로 가입할 수 있어요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 회원가입 폼 */}
          <form action={signupAction} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="이메일"
              placeholder="example@email.com"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <Input
              name="password"
              type="password"
              label="비밀번호"
              placeholder="6자 이상 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <Input
              name="passwordConfirm"
              type="password"
              label="비밀번호 확인"
              placeholder="비밀번호를 다시 입력하세요"
              required
              className="focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            {/* 약관 동의 */}
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="terms"
                value="agreed"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">
                <a href="#" className="text-purple-600 hover:underline">이용약관</a>
                {" 및 "}
                <a href="#" className="text-purple-600 hover:underline">개인정보처리방침</a>
                에 동의합니다
              </span>
            </label>

            <div className="flex flex-col gap-3 pt-2">
              <SubmitButton
                variant="primary"
                size="lg"
                className="w-full rounded-lg"
              >
                가입하기
              </SubmitButton>
              <p className="text-center text-sm text-gray-500">
                이미 계정이 있으신가요?{" "}
                <a href="/login" className="font-medium text-purple-600 hover:text-purple-700">
                  로그인
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-purple-500">
        국내외 최저가 호텔을 트립비토즈에서 찾아보세요
      </p>
    </div>
  );
}
