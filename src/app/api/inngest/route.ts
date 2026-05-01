import { serve } from "inngest/next";
import { inngest } from "@/infrastructure/inngest/client";
import { showcaseFunctions } from "@/infrastructure/inngest/functions/showcase";

/**
 * Inngest 서빙 엔드포인트
 * Vercel 배포 시 https://{domain}/api/inngest 로 등록한다.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: showcaseFunctions,
});
