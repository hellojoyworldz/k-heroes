# K-Heroes 프로젝트

> 문화 빅데이터 기반 한국 역사·지역 문화 인터랙티브 시뮬레이션 서비스

---

## 언어 규칙

- 모든 소통은 한국어로 진행한다
- 코드 주석, 커밋 메시지, PR 설명 모두 한국어 사용
- 변수명/함수명은 영어 사용

---

## 기술 스택

| 분류      | 기술                                 |
| --------- | ------------------------------------ |
| Framework | Next.js 16, React 19, TypeScript 5   |
| Styling   | Tailwind CSS v4, shadcn/ui, Radix UI |
| 상태관리  | Zustand, TanStack Query              |
| 패키지    | pnpm                                 |

---

## 폴더 구조

표준 Next.js App Router 구조를 따른다.

```text
app/
├── page.tsx          # 메인 소개 페이지
├── scenario/         # 시대 / 지역 / 인물 시나리오 페이지
├── simulation/       # 사용자 선택 시뮬레이션 페이지
└── api/              # Route Handler

components/
├── ui/               # shadcn/ui 기반 공통 컴포넌트
├── layout/           # Header, Providers, 공통 레이아웃
├── scenario/         # 시나리오 관련 컴포넌트
├── simulation/       # 선택 플로우 관련 컴포넌트
└── result/           # 결과 / 실제 역사 비교 컴포넌트

lib/
├── api/              # API 호출 유틸
├── constants/        # 상수 정의
└── utils/            # 공통 유틸

stores/
└── simulation-store.ts # 시뮬레이션 상태 관리

types/index.ts        # 전체 타입 정의
```

---

## 핵심 플로우

1. 발단 → 시대 / 지역 / 인물 소개
2. 전개 → 갈등 상황 제시
3. 선택 → 사용자 행동 선택
4. 결과 → 선택 영향 표시
5. 실제 역사 비교 → 실제 역사 연결
6. 현재 지역 연결 → 현재 문화재 / 지역 스토리 연결

---

## 사용 문화 빅데이터

- 지역이야기 역사인물
- 지역이야기 예술인

## 개발 규칙

- pnpm만 사용
- App Router 기반 구조 사용
- 서버 컴포넌트 우선 사용
- 공통 UI 컴포넌트 분리
- 화면 플로우 중심으로 MVP 우선 구현
- AI/API는 추후 Route Handler 기반 연결 예정

---

## 커밋 컨벤션

형식: `type: 내용`

| 타입     | 설명              |
| -------- | ----------------- |
| feat     | 새로운 기능 추가  |
| fix      | 버그 수정         |
| refactor | 코드 구조 개선    |
| style    | UI/코드 포맷 수정 |
| docs     | 문서 수정         |
| test     | 테스트 추가/수정  |
| chore    | 설정 파일 변경    |
| perf     | 성능 개선         |

**예시:**

```text
feat: 영수증 AI 분석 API 추가
fix: 출퇴근 중복 저장 버그 수정
chore: Supabase RLS 정책 추가
```

## 초기 목표

1. Next.js + Tailwind 기본 세팅
2. shadcn/ui 세팅
3. 기본 레이아웃 및 페이지 placeholder 구성
4. 시나리오 → 선택 → 결과 플로우 UI 구현
5. 문화 빅데이터 기반 MVP 구현
6. 추후 AI/RAG 구조 연결 가능하도록 설계

---

## 기획 문서 규칙

- 기획 변경 시 PLANNING.md 함께 업데이트
- 기능 추가/변경 시 변경 내용 기록
- 미확정 내용은 ⚠️ 기획 확정 필요 표시
