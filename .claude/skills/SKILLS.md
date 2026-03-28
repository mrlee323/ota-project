# My Claude Skills

개발 워크플로우 전체를 커버하는 커스텀 스킬 모음.

## 전체 워크플로우

```
/scan → /plan → /tdd 또는 /unit-test → /smart-commit
```

---

## 스킬 목록

### `/scan` — 프로젝트 파악
새 프로젝트 폴더를 받았을 때 기술 스택, 디렉토리 구조, 핵심 패턴, 실행 방법을 한눈에 정리.

```
/scan              # 전체 스캔
/scan --stack      # 기술 스택만
/scan --structure  # 디렉토리 구조만
/scan --patterns   # 코드 패턴만
/scan --run        # 실행 방법만
```

---

### `/plan` — 설계 & 작업 분해
요구사항을 분석해서 타입 설계 → 컴포넌트 분해 → 개발 순서 체크리스트 생성.
안쪽(유틸)부터 바깥쪽(페이지)으로 쌓는 순서로 작업을 쪼개줌.

```
/plan              # README, docs 자동 탐색
/plan 요구사항.md  # 특정 파일 분석
```

---

### `/tdd` — 테스트 주도 개발
"테스트 먼저 → 최소 구현 → 리팩터" 사이클을 단계별로 가이드.
구현 **전**에 사용, 개발 방향을 테스트로 잡아가는 방식.

```
/tdd               # 다음 작업 항목으로 TDD 시작
/tdd formatPrice   # 특정 함수 TDD
```

---

### `/unit-test` — 유닛 테스트 자동 생성
기존 소스 코드를 분석해서 테스트 파일을 자동 생성하고 실행까지 확인.
구현 **후** 커버리지를 빠르게 채울 때 사용.

```
/unit-test src/utils/format.ts   # 파일 지정
/unit-test src/utils/            # 디렉토리 전체
/unit-test --coverage            # 빠진 테스트만 추가
```

---

### `/readme` — README 생성 & 정리
소스 코드 기반으로 README.md를 자동 생성하거나 업데이트.
실제 스크립트명, 포트, 의존성만 사용 (추측 금지).

```
/readme            # 없으면 생성, 있으면 업데이트
/readme --new      # 새로 작성
/readme --update   # 빠진 부분만 추가
/readme --en       # 영어로 작성
```

---

### `/smart-commit` — 컨벤션 커밋
변경사항을 검토하고 Conventional Commits 형식으로 커밋 메시지 자동 생성.

```
커밋해줘 / commit / smart commit
```

---

## 설치

```bash
unzip my-skills.zip -d ~/
```

`~/.claude/skills/` 에 압축 해제 후 Claude 재시작.
