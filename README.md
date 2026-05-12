# 🚀 OTA Project: AI-Native Development Framework

AI 에이전트와 자동화 스크립트를 활용하여 극도의 개발 생산성을 지향하는 **Next.js 14** 기반 프로젝트입니다.
단순한 코드 작성을 넘어, **DDD(Domain-Driven Design)** 아키텍처와 **AI 자동화 파이프라인**을 통해 지속 가능한 소프트웨어를 구축합니다.

🔗 **Live Demo**: [https://ota-project.vercel.app](https://ota-project.vercel.app)


<p>
  <img src="https://aapvsizzcugmfsxakpvi.supabase.co/storage/v1/object/public/showcase-images/screenshots/showcase-admin.gif" />
</p>

---

## 🔐 어드민 접속 방법

1. [https://ota-project.vercel.app/login](https://ota-project.vercel.app/login) 접속
2. 테스트 계정으로 로그인
   - ID: `admin@gmail.com`
   - PW: `admin1234`
3. 로그인 후 [/admin](https://ota-project.vercel.app/admin) 페이지에서 관리자 기능 사용

---

## 🛠 Getting Started

### 1. 설치 및 의존성

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 주요 명령어 (Automation)

- `npm run gc`: AI 기반 자동 커밋 실행 (추천: 커서 챗에서 "gc" 입력)
- `npm run test`: Vitest 단위 테스트 실행

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router), React 18
- **Language**: TypeScript
- **State Management**: Jotai (UI State), XState (Business Workflow)
- **Styling**: Tailwind CSS v3
- **Validation**: Zod
- **Test**: Vitest
- **Automation**: Cursor AI, Husky, tsx

---

## 🏗 Directory Structure (DDD)

모든 코드는 정의된 레이어에 맞게 격리되어 관리됩니다.

- **`src/domain`**: 순수 비즈니스 로직. 프레임워크/라이브러리 의존성 없음.
- **`src/application`**: 유스케이스 및 상태 흐름 제어 (XState, Jotai).
- **`src/infrastructure`**: 외부 서비스 연동 (API, Storage, AI SDK).
- **`src/ui`**: 화면 표시 레이어. 디자인 토큰 및 Atomic 컴포넌트.
- **`src/automation`**: 개발 효율을 위한 AI 에이전트 및 자동화 스크립트.

---

## 💡 개발 원칙

1. **Pragmatic Approach**: 무조건적인 패턴 적용보다 현재 상황에 가장 적합한 단순한 해결책 우선.
2. **Strict Layering**: UI와 도메인 로직이 섞이지 않도록 레이어별 책임 엄격 준수.
3. **Automate Everything**: 반복되는 모든 작업은 스크립트화하여 AI가 수행하도록 설계.
