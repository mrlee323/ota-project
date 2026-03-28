---
name: smart-commit
description: 현재 git 변경사항을 검토하고 Conventional Commits 형식으로 커밋해주는 스킬. 사용자가 "커밋해줘", "변경사항 커밋", "commit", "코드 확인하고 커밋", "smart commit", "컨벤션에 맞게 커밋" 같은 말을 할 때 반드시 이 스킬을 사용해야 한다. 코드를 먼저 검토하고 문제가 있으면 알려준 뒤 커밋 메시지를 자동 생성해 커밋한다.
allowed-tools:
  - Bash(command:git *)
  - Read
  - Grep
  - Glob
---

# Smart Commit

사용자가 현재 변경사항을 커밋하고 싶을 때 사용하는 스킬이다. 코드를 먼저 가볍게 살펴보고, 큰 문제만 잡아낸 뒤, Conventional Commits 형식에 맞는 커밋 메시지를 자동으로 만들어 커밋한다.

## 흐름

1. **변경사항 파악** — staged 파일 확인, 없으면 전체 stage 여부 물어봄
2. **가벼운 코드 검토** — 큰 문제(보안, 런타임 에러)만 체크
3. **커밋 메시지 생성** — Conventional Commits 형식으로 자동 생성
4. **커밋** — HEREDOC 방식으로 안전하게 커밋

---

## Step 1: 변경사항 파악

```bash
git status --short
git diff --cached --stat
```

**Staged 파일이 없을 때:**
바로 막지 말고, 먼저 물어본다:

> "현재 staged된 파일이 없어요. 변경된 파일 전체를 추가하고 커밋할까요?"

- 사용자가 OK하면 → `git add -A` 후 진행
- 사용자가 거절하면 → `git add`로 파일을 추가한 뒤 다시 시도 안내

---

## Step 2: 코드 검토 (가볍게)

```bash
git diff --cached
```

변경된 코드를 보고 아래 항목만 체크한다. **스타일 이슈는 무시**하고 실제로 문제가 될 수 있는 것만 잡는다.

**커밋 전에 사용자에게 알려야 할 것:**
- 하드코딩된 비밀값 (API 키, 비밀번호, 토큰 등)
- 명백한 런타임 에러 (null 역참조, 잘못된 타입 등)
- 의도치 않게 남은 디버그 코드 (`console.log`, `debugger`, `print` 등)

**경고만 하고 커밋은 진행:**
- 미사용 import/변수
- 개선 여지가 있지만 동작에는 문제 없는 코드

문제가 없으면 조용히 Step 3으로 넘어간다.

---

## Step 3: 커밋 메시지 생성

### Conventional Commits 형식

```
<type>(<scope>): <description>

[optional body]
```

**type 선택 기준:**

| type | 언제 쓰는가 |
|------|------------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없이 코드 구조 개선 |
| `style` | 포맷, 공백 등 (로직 변경 없음) |
| `docs` | 문서 수정 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 패키지 업데이트 등 |
| `perf` | 성능 개선 |

**scope:** 변경된 영역 (파일명, 모듈명, 컴포넌트명 등). 명확하지 않으면 생략.

**description 규칙:**
- 영어 소문자로 시작, 명령형 (add, fix, update)
- 한국어도 OK — 프로젝트에 기존 커밋이 있으면 그 언어에 맞춤
- **50자 이내**, 마침표 없음

**body (선택):** 변경 이유나 배경이 복잡할 때만 추가. 간단한 변경은 생략.

**예시:**
```
feat(auth): add JWT login support
fix(cart): fix total price when quantity is 0
refactor(api): extract duplicate fetch into shared util
chore: update eslint config
```

변경사항이 여러 type에 걸쳐 있으면, 가장 중심이 되는 변경에 맞춰 하나의 type을 선택한다.

---

## Step 4: 커밋 실행

### 큰 문제가 없는 경우

메시지를 보여주고 바로 커밋:

```
커밋 메시지: feat(login): add social login button

커밋할게요!
```

HEREDOC 방식으로 커밋 (특수문자, 멀티라인 메시지에 안전):

```bash
git commit -m "$(cat <<'EOF'
feat(login): add social login button

소셜 로그인 버튼 UI 및 OAuth 연동 로직 추가
EOF
)"
```

body가 없는 단순 커밋은 한 줄로:
```bash
git commit -m "chore: update eslint config"
```

### 큰 문제가 있는 경우

커밋 전에 사용자에게 알린다:

```
커밋 전에 확인이 필요한 부분이 있어요:

⚠️  src/api/client.js 12번째 줄에 API 키가 하드코딩되어 있어요.
    → 환경변수로 분리하는 것을 권장해요.

그래도 커밋할까요?
```

사용자가 진행하라고 하면 커밋한다.

---

## 주의사항

- **force push나 amend는 하지 않는다** — 사용자가 명시적으로 요청하기 전까지.
- **커밋 메시지는 하나만** — 여러 커밋으로 쪼개지 않는다 (사용자 요청 없으면).
