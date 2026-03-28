---
name: unit-test
description: |
  소스 코드를 분석해서 유닛 테스트를 자동으로 생성합니다. 테스트 프레임워크(vitest/jest)를 자동 감지하고,
  프로젝트의 기존 테스트 스타일에 맞춰 작성합니다. 실행까지 해서 통과 여부를 확인합니다.

  사용자가 "유닛 테스트 만들어줘", "테스트 생성해줘", "이 파일 테스트 짜줘", "/unit-test",
  "unit-test", "테스트 커버리지 높여줘", "테스트 파일 없어", "자동으로 테스트 생성",
  "이 함수 테스트 코드 만들어줘", "generate tests", "테스트 자동 생성"
  같은 말을 하면 반드시 이 스킬을 사용해야 합니다.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash(command:npm test*)
  - Bash(command:yarn test*)
  - Bash(command:npx vitest*)
  - Bash(command:npx jest*)
  - Bash(command:cat package.json*)
  - Bash(command:ls *)
---

소스 코드를 분석해서 유닛 테스트를 자동 생성하고 실행까지 합니다.

## 입력 처리

사용자 입력: `$ARGUMENTS`

- `src/utils/format.ts` 같은 파일 경로: 해당 파일의 테스트 생성
- `src/utils/` 같은 디렉토리: 디렉토리 내 파일 전체 테스트 생성
- `--framework vitest|jest`: 프레임워크 강제 지정
- `--coverage`: 커버리지 분석 후 빠진 테스트만 추가
- 인자 없으면: 테스트 파일이 없는 소스 파일을 탐색하거나 사용자에게 대상 확인

## 1단계: 환경 파악

`package.json`을 읽어 확인:
- 테스트 프레임워크: `vitest` / `jest`
- 테스트 실행 명령어: `npm test`, `yarn test`, `vitest run` 등
- 테스트 관련 설정 파일: `vitest.config.*`, `jest.config.*`

기존 테스트 파일을 1~2개 읽어서 프로젝트의 테스트 스타일을 파악하세요:
- import 방식
- describe/it 네이밍 컨벤션 (한국어/영어)
- mock 사용 패턴
- 파일 위치 규칙 (`__tests__/` vs `.test.ts` 같은 위치)

## 2단계: 소스 분석

대상 파일을 읽고 추출할 것:

**함수/클래스 목록**
- export된 모든 함수, 클래스, 훅
- 각각의 파라미터 타입과 반환 타입
- 비동기 여부 (async/Promise)

**의존성**
- 외부 모듈 import (모킹 필요 여부 판단)
- API 호출, DOM 접근, 전역 상태 등 사이드 이펙트

**핵심 로직**
- 조건 분기 (if/switch) → 각 분기가 테스트 케이스 후보
- 에러를 던지는 조건
- 경계값이 있는 로직 (숫자 범위, 빈 배열 등)

## 3단계: 테스트 케이스 설계

각 함수마다 아래 3종류를 빠짐없이 만드세요:

```
✅ 정상 케이스 (Happy Path)
   - 일반적인 입력 → 기대하는 출력

⚠️  경계 케이스 (Edge Cases)
   - 빈 문자열, 빈 배열, 0, null, undefined
   - 최대/최소값
   - 특수문자, 공백

❌ 에러 케이스 (Error Cases)
   - 잘못된 타입/형식의 입력
   - 에러를 던져야 하는 조건
   - 비동기 실패 (네트워크 에러 등)
```

불명확한 동작(경계에서 에러 vs 기본값 반환 등)은 구현 전에 사용자에게 확인하세요.

## 4단계: 테스트 파일 생성

**파일 위치 결정 규칙** (기존 프로젝트 패턴 우선):
```
src/utils/format.ts
  → src/utils/__tests__/format.test.ts   (기존에 __tests__ 폴더 있는 경우)
  → src/utils/format.spec.ts             (기존에 .spec 패턴인 경우)
  → src/utils/format.test.ts             (기본)
```

**테스트 파일 구조:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
// (jest라면 import 없이 전역 사용)

import { targetFunction } from '../target'

describe('targetFunction', () => {
  // 필요한 경우에만 beforeEach/afterEach 사용

  describe('정상 케이스', () => {
    it('[입력 조건]이면 [기대 결과]를 반환한다', () => {
      // Arrange
      const input = ...

      // Act
      const result = targetFunction(input)

      // Assert
      expect(result).toBe(...)
    })
  })

  describe('경계 케이스', () => {
    it('빈 값이 주어지면 ...', () => { ... })
  })

  describe('에러 케이스', () => {
    it('잘못된 입력이면 에러를 던진다', () => {
      expect(() => targetFunction(invalidInput)).toThrow('에러 메시지')
    })
  })
})
```

**모킹 원칙:**
- 외부 API, 파일 시스템, 타이머 등만 mock
- 내부 유틸 함수는 실제 구현 사용
- `vi.mock()` / `jest.mock()`은 파일 최상단에

## 5단계: 실행 & 검증

테스트 파일 생성 후 바로 실행:
```bash
npx vitest run [테스트파일경로] --reporter=verbose
# 또는
npx jest [테스트파일경로] --verbose
```

실패하는 테스트가 있으면:
1. 에러 메시지를 읽고 원인 파악
2. 테스트 코드 문제인지, 소스 코드 문제인지 구분
3. 테스트 코드가 잘못된 경우 수정 후 재실행
4. 소스 코드 버그를 발견한 경우 사용자에게 알림 (임의로 수정하지 않음)

---

## 출력 형식

완료 후 다음을 보고하세요:

```
생성된 테스트 파일: src/utils/__tests__/format.test.ts

테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 통과  8개
❌ 실패  0개
⏭️  스킵  0개

생성된 테스트 케이스:
  formatPrice
    ✅ 1000 → "1,000원"
    ✅ 0 → "0원"
    ✅ 음수 → 에러 던짐
    ✅ null → 에러 던짐

특이사항: (있는 경우만)
  - formatDate의 timezone 처리가 불명확해서 UTC 기준으로 작성했습니다.
    다른 기준이 있다면 알려주세요.
```

---

## 작성 원칙

- **프로젝트 스타일 따르기**: 기존 테스트 파일의 패턴을 그대로 유지
- **테스트당 하나의 검증**: `expect`는 하나씩, 여러 개가 필요하면 테스트를 나눔
- **구현 세부사항 테스트 금지**: 내부 상태나 private 함수 직접 접근 X
- **명확한 테스트명**: "동작해야 한다" 대신 "1000이 주어지면 1,000원을 반환한다"
- **불필요한 mock 금지**: 꼭 필요한 것만, 과도한 mock은 테스트 신뢰도를 낮춤
