# 🚀 OTA Project: AI-Native Development Framework

AI 에이전트와 자동화 스크립트를 활용하여 극도의 개발 생산성을 지향하는 **Next.js 14** 기반 프로젝트입니다.
단순한 코드 작성을 넘어, **DDD(Domain-Driven Design)** 아키텍처와 **AI 자동화 파이프라인**을 통해 지속 가능한 소프트웨어를 구축합니다.

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

## 🤖 AI-Driven Commit Workflow

프로젝트의 일관된 품질 관리와 신속한 기록을 위해 AI 에이전트 기반의 커밋 시스템을 활용합니다.

### 가동 프로세스 (Shortcut: `gc`)

코드 수정 후 Cursor AI에게 **"gc"** 또는 **"자동 커밋"** 요청 시 다음 과정이 자동 수행됩니다.

1.  **Stage**: 변경 사항 자동 스테이징 (`git add .`)
2.  **Analysis**: `gen-commit.ts`를 통한 아키텍처 변경 분석
3.  **Synthesis**: Conventional Commits 형식을 준수하는 AI 메시지 생성
4.  **Verification**: Husky(Lint/Format)를 통한 최종 검증 후 커밋 기록

---

## 💡 개발 원칙

1. **Pragmatic Approach**: 무조건적인 패턴 적용보다 현재 상황에 가장 적합한 단순한 해결책 우선.
2. **Strict Layering**: UI와 도메인 로직이 섞이지 않도록 레이어별 책임 엄격 준수.
3. **Automate Everything**: 반복되는 모든 작업은 스크립트화하여 AI가 수행하도록 설계.
