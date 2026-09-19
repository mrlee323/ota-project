import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { getFeatureAccess } from "@/infrastructure/admin/permissionsApi";
import { isRegisteredRedirect } from "@/domain/auth/oauth";
import { getClient, issueCode } from "@/infrastructure/mcp/oauthStore";

// ─── 인가 엔드포인트 ────────────────────────────────────────────────────────
//
// **사람이 하는 일은 로그인 하나다.** 토큰 원문을 복사해 클라이언트에
// 옮기는 단계를 없애려고 만든 화면이다 (docs/md/plan.md §9).
//
// 흐름 — 클라이언트가 여기로 보낸다 → 로그인 안 돼 있으면 /login 으로 보내고
// 돌아올 주소를 들려 보낸다 → 로그인하면 여기로 돌아온다 → 「연결」 을 누르면
// 코드를 만들어 클라이언트 주소로 돌려준다.

export const dynamic = "force-dynamic";

/** 클라이언트에게 규격대로 오류를 돌려준다. 돌려줄 주소를 믿을 수 있을 때만 쓴다 */
function bounce(redirectUri: string, state: string | undefined, error: string, description: string) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  redirect(url.toString());
}

/** 돌려줄 주소를 믿을 수 없으면 리다이렉트하지 않고 여기서 멈춘다 */
function Stop({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{detail}</p>
      </div>
    </div>
  );
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AuthorizePage({ searchParams }: { searchParams: Params }) {
  const clientId = one(searchParams.client_id);
  const redirectUri = one(searchParams.redirect_uri);
  const responseType = one(searchParams.response_type);
  const challenge = one(searchParams.code_challenge);
  const challengeMethod = one(searchParams.code_challenge_method);
  const state = one(searchParams.state);
  const resource = one(searchParams.resource);

  if (!clientId || !redirectUri) {
    return <Stop title="연결할 수 없습니다" detail="client_id 와 redirect_uri 가 필요합니다." />;
  }

  const client = await getClient(clientId);
  if (!client) {
    return <Stop title="모르는 클라이언트입니다" detail="먼저 등록을 마친 뒤 다시 시도하세요." />;
  }

  // **등록된 주소와 정확히 같아야 한다.** 여기가 코드가 새는 자리다 —
  // 이 검사를 통과하기 전에는 그 주소로 아무것도 돌려보내지 않는다
  if (!isRegisteredRedirect(redirectUri, client.redirectUris)) {
    return (
      <Stop
        title="등록되지 않은 주소입니다"
        detail="클라이언트가 등록할 때 알려준 주소로만 돌려보낼 수 있습니다."
      />
    );
  }

  // 여기서부터는 redirectUri 를 믿을 수 있다 — 규격대로 오류를 실어 보낸다
  if (responseType !== "code") {
    bounce(redirectUri, state, "unsupported_response_type", "code 만 지원합니다");
  }
  if (!challenge || challengeMethod !== "S256") {
    bounce(redirectUri, state, "invalid_request", "PKCE(S256)가 필요합니다");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인이 안 돼 있으면 로그인시키고 **이 주소로 되돌린다**
  if (!user) {
    const self = new URL("https://placeholder.local/oauth/authorize");
    for (const [k, v] of Object.entries(searchParams)) {
      const s = one(v);
      if (s !== undefined) self.searchParams.set(k, s);
    }
    redirect(`/login?next=${encodeURIComponent(self.pathname + self.search)}`);
  }

  const access = await getFeatureAccess("md");
  if (!access.canWrite) {
    bounce(redirectUri, state, "access_denied", "이 계정에는 MD 권한이 없습니다");
  }

  async function approve() {
    "use server";
    // 서버에서 한 번 더 확인한다 — 이 액션은 폼에서 직접 불린다
    const sb = await createClient();
    const {
      data: { user: me },
    } = await sb.auth.getUser();
    if (!me) redirect("/login");

    const still = await getFeatureAccess("md");
    if (!still.canWrite) redirect("/admin");

    const code = await issueCode({
      clientId: clientId!,
      userId: me.id,
      redirectUri: redirectUri!,
      codeChallenge: challenge!,
      resource,
    });

    const back = new URL(redirectUri!);
    back.searchParams.set("code", code);
    if (state) back.searchParams.set("state", state);
    redirect(back.toString());
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm font-bold text-gray-900">
          「{client.clientName}」을(를) 연결할까요?
        </p>
        <p className="mt-1 text-xs text-gray-500">{user.email}</p>

        <ul className="mt-4 space-y-1.5 text-xs leading-relaxed text-gray-600">
          <li>· 기획전 모듈과 호텔을 읽습니다</li>
          <li>· 기획전을 <b className="text-gray-900">초안으로만</b> 만들고 고칩니다</li>
          <li>· 발행은 하지 못합니다 — 담당자가 직접 합니다</li>
        </ul>

        <form action={approve} className="mt-5">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-3 py-2 text-[13px] text-white"
          >
            연결
          </button>
        </form>

        <p className="mt-3 text-[11px] text-gray-400">
          연결은 어드민의 「AI 연결 토큰」에서 언제든 끊을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
