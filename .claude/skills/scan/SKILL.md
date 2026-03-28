---
name: scan
description: |
  새로운 프로젝트 폴더를 받았을 때 한눈에 파악할 수 있도록 프로젝트 전체를 스캔하고 요약해줍니다.
  기술 스택, 디렉토리 구조, 핵심 패턴, 실행 방법을 빠르게 분석합니다.

  사용자가 "이 프로젝트 파악해줘", "프로젝트 분석해줘", "어떤 프로젝트야", "구조 설명해줘",
  "scan", "/scan", "프로젝트 구조 알려줘", "코드베이스 파악", "어떤 코드야", "이게 뭐야"
  같은 말을 하면 반드시 이 스킬을 사용해야 합니다. 처음 접하는 프로젝트 폴더를 열었을 때도
  자동으로 이 스킬을 활용하세요.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(command:git log*)
  - Bash(command:git branch*)
  - Bash(command:git shortlog*)
  - Bash(command:ls *)
  - Bash(command:cat *)
  - Bash(command:node --version*)
  - Bash(command:npm --version*)
  - Bash(command:find * -maxdepth*)
---

처음 받은 프로젝트 폴더를 빠르게 파악합니다.

## 입력 처리

사용자 입력: `$ARGUMENTS`

- `--stack`: 기술 스택 분석만
- `--structure`: 디렉토리 구조 설명만
- `--patterns`: 코드 패턴 분석만
- `--run`: 실행 방법만
- 인자 없으면 전체 스캔 (1~2분 안에 프로젝트 전체 그림을 제공)

## 스캔 순서

### 1단계: 빠른 정보 수집 (자동 실행)

아래 정보를 동시에 읽어 전체 맥락을 파악하세요:
- `README.md` (또는 `README`) — 프로젝트 설명
- `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `pom.xml` — 의존성 및 스크립트
- 최상위 디렉토리 목록 (`ls -la`)
- `.env.example` / `.env.sample` — 환경 변수 힌트
- `docker-compose.yml` / `Dockerfile` — 인프라 힌트

### 2단계: 핵심 파일 탐색

스택에 따라 추가로 읽을 파일:
- **웹 프론트엔드**: `src/App.tsx`, `src/main.ts`, `vite.config.*`, `next.config.*`, `tailwind.config.*`
- **백엔드**: `src/index.*`, `src/server.*`, `src/app.*`, `src/main.*`
- **설정**: `.eslintrc.*`, `tsconfig.json`, `jest.config.*`

### 3단계: 패턴 파악

Grep으로 확인할 것들:
- 상태 관리: `zustand`, `redux`, `recoil`, `jotai`, `pinia`, `vuex`
- API 통신: `axios`, `fetch`, `react-query`, `swr`, `apollo`
- 라우팅: `react-router`, `next/router`, `vue-router`
- 인증: `jwt`, `session`, `oauth`, `supabase`, `firebase`
- DB/ORM: `prisma`, `drizzle`, `sequelize`, `typeorm`, `mongoose`

---

## 출력 형식

아래 구조로 **간결하고 밀도 있게** 작성하세요. 장황하게 설명하지 말고 핵심만 담으세요.

---

# [프로젝트명] 스캔 결과

## 한 줄 요약
> [이 프로젝트가 무엇인지 한 문장]

## 기술 스택
| 분류 | 기술 |
|------|------|
| 언어 | TypeScript 5.x |
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| DB | PostgreSQL + Prisma |
| 배포 | Vercel |

## 디렉토리 구조
```
src/
├── app/          # Next.js App Router 페이지
├── components/   # 재사용 UI 컴포넌트
├── lib/          # 유틸리티, DB 클라이언트
├── hooks/        # 커스텀 훅
└── types/        # 타입 정의
```
각 폴더 한 줄 설명 포함.

## 핵심 패턴
- **데이터 페칭**: React Query / SWR / fetch 등 방식
- **인증**: JWT / 세션 / OAuth 방식
- **API 구조**: REST / GraphQL / tRPC 등
- 특이한 패턴이나 주의할 점

## 실행 방법
```bash
npm install
cp .env.example .env  # 필요시
npm run dev           # http://localhost:3000
```

## 주요 스크립트
| 명령어 | 역할 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 테스트 |

## Git 현황 (있는 경우)
- 브랜치: `main`, `develop`, `feature/*`
- 최근 커밋 패턴 (conventional commits 여부 등)

## 파악하면 좋을 파일들
처음 코드를 읽는다면 이 순서로 보세요:
1. `src/app/page.tsx` — 진입점
2. `src/lib/db.ts` — DB 연결
3. `src/components/` — UI 구조

---

## 작성 원칙

- **핵심만**: 모든 파일을 나열하지 말고, 이해에 필요한 것만 선택
- **구체적으로**: "상태관리 있음" 대신 "Zustand로 장바구니/인증 상태 관리"
- **실용적으로**: 실제로 이 프로젝트에서 작업을 시작하려면 무엇을 알아야 하는가에 집중
- **길이**: 전체 응답이 스크롤 없이 읽힐 정도 (너무 길면 핵심을 잃음)
- 발견한 특이사항이나 주의사항은 별도로 언급
