import { Inngest } from "inngest";

/**
 * Inngest 클라이언트 싱글톤
 * - INNGEST_EVENT_KEY 환경변수를 자동으로 읽는다 (개발: 생략 가능)
 * - 모든 Inngest 함수와 이벤트 전송에 이 인스턴스를 사용한다
 */
export const inngest = new Inngest({ id: "ota-project" });
