# Phase 0 Research: 신축매입약정 사업지 스코어보드

이 기능은 스펙(spec.md)과 사용자의 plan 입력이 이미 기술적 선택을 확정했고, 기존 구현(`index.html`/`css/`/`js/`/`data/sites.json`)이 이미 존재하는 상태이므로 Technical Context에 `NEEDS CLARIFICATION`이 남지 않았다. 따라서 본 문서는 확정된 선택의 근거(rationale)와 검토했던 대안을 정리한 결정 기록이다.

## 1. 스크롤 전환 메커니즘

- **Decision**: GSAP 3.12 + ScrollTrigger 플러그인, `pin: true` + `scrub: true`. 각 사업지 섹션 100vh 고정 구간 동안 이미지 `scale 1.15 → 1.0`, 다음 섹션 `translateY(100%) → 0`.
- **Rationale**: 사용자가 명시적으로 지정했고, Constitution IV가 "GSAP ScrollTrigger pin+scrub이 유일한 스크롤 메커니즘"이라고 이미 고정해 두었다. `pin`은 섹션이 스크롤 중 화면에 고정된 채로 내부 애니메이션이 스크럽되게 하고, `scrub: true`는 애니메이션 진행률을 스크롤 위치에 직접 결속해 사용자가 어느 지점에서 멈추든 자연스러운 중간 상태를 보장한다.
- **Alternatives considered**: (a) CSS `position: sticky` + `IntersectionObserver` 조합 — 스크럽 세밀도가 떨어지고 pin 해제 타이밍 제어가 어려움. (b) Framer Motion/Lenis 등 추가 라이브러리 — Constitution IV가 GSAP 외 라이브러리 도입을 금지.

## 2. 게이지 애니메이션

- **Decision**: SVG `<circle>`/`<path>`의 `stroke-dasharray`/`stroke-dashoffset`을 조작해 0→실제 점수까지 1회 채움. 트리거는 `ScrollTrigger.create({ onEnter: ... })`이며 `scrub`이 아니라 일반 트윈(`gsap.to`)으로 진행해 재진입 시 재실행되지 않는다(`once: true`류 가드).
- **Rationale**: Constitution V가 "CSS width/transform: scaleX/canvas 금지, stroke-dashoffset만" + "onEnter 1회, 재트리거·스크럽 금지"를 이미 못 박음. 기존 `js/main.js` 구현이 이 방식을 그대로 따르고 있어 그대로 유지한다.
- **Alternatives considered**: `<canvas>` 기반 커스텀 렌더 — 접근성(DOM 텍스트 추출) 저하와 불필요한 복잡도로 기각.

## 3. 디자인 토큰 파이프라인

- **Decision**: `DESIGN.md`(Framer, `npx getdesign@latest add framer` 산출물)를 유일한 소스로 삼아 `css/tokens.css`에 색·간격·라운드·타이포 값을 그대로 옮긴다. 예외는 문서화된 두 가지뿐: (1) 폰트 GT Walsheim → Pretendard 700(디스플레이)/400(본문), 폴백 Inter, jsDelivr Pretendard 배포 CDN 사용, (2) 한글 디스플레이 자간 전 티어 `-0.03em` 통일(원문의 티어별 px 값 대신).
- **Rationale**: GT Walsheim은 한글 미지원+비공개 재배포 폰트라 그대로 쓸 수 없고, 한글은 라틴 대비 자간을 좁힐 여유가 적어 원문 비율(약 -5%)을 그대로 적용하면 글자가 겹친다. 두 예외 모두 Constitution III에 이미 근거가 문서화되어 있다.
- **Alternatives considered**: Noto Sans KR — Pretendard 대비 Framer의 두꺼운 디스플레이 웨이트 느낌을 재현하기 어렵다고 판단해 기각(사용자가 이번 plan 입력에서도 Pretendard를 재확인).

## 4. 컴포넌트 클래스명 매핑

- **Decision**: `DESIGN.md`의 `components:` 블록 키(`top-nav`, `footer`, `pricing-card`, `feature-row`, `comparison-row`, `gradient-spotlight-card`, `product-mockup-tile` 등)를 이 프로젝트의 대응 요소에 변형 없이 그대로 클래스명으로 사용한다. 구조적으로 대응이 없는 컴포넌트(`faq-row`, `text-input` 등)는 강제로 매핑하지 않는다.
- **Rationale**: Constitution III의 명시적 요구사항. `tokens.css`와 `DESIGN.md`를 나란히 diff하는 것만으로 디자인 드리프트를 검증할 수 있게 한다.
- **현재 상태**: `top-nav`/`footer`/`pricing-card`/`feature-row`/`comparison-row`는 `css/tokens.css`에 이미 존재. `gradient-spotlight-card`/`product-mockup-tile`는 주석에만 있고 실제 클래스로 아직 부여되지 않음 — plan.md의 "기존 구현 갭 분석" 4번 항목으로 이월, `/speckit-tasks`에서 작업화한다.

## 5. 데이터 재계산 및 무결성 로깅

- **Decision**: `total`/`grade`는 항상 `scores` 5항목 합계와 `gradeRule`(A≥85, B70-84, C55-69, D<55)로 클라이언트에서 재계산. JSON에 저장된 값과 다르면 `console.warn`으로 사업지명+두 값을 로깅하되 화면은 재계산 값을 그대로 사용.
- **Rationale**: Constitution VI. JSON을 신뢰하지 않고 항상 파생값을 검증 가능한 소스(scores 배열)로부터 재생성해 데이터 입력 실수를 화면에 그대로 노출하는 사고를 막는다.
- **Alternatives considered**: 서버 사이드 검증 — 정적 사이트라 서버가 없어 해당 없음. 빌드 타임 검증 스크립트 — Constitution I(빌드 없음)에 위배되어 기각.

## 6. 비교 표 정렬 상태

- **Decision**: 정렬 상태(`{ key, dir }`)는 모듈 스코프 JS 변수(`sortState`)에만 보관. `localStorage`/URL 파라미터/쿠키 사용 안 함. 기본 정렬은 합계 점수 내림차순, 동점 시 입지 점수 내림차순(2차 키) — **현재 구현은 2차 키가 없어 갭으로 기록**.
- **Rationale**: Constitution VII. 4행짜리 비교 표에 영속화 상태를 두는 것은 이득 없이 엣지 케이스(오래된 정렬 키, 탭 간 불일치)만 추가한다.
- **Alternatives considered**: `localStorage`에 마지막 정렬 저장 — 사용자가 요구하지 않았고 Constitution VII가 금지.

## 7. 배포 & 상대경로

- **Decision**: GitHub Pages, `main` 브랜치 저장소 루트를 Pages 소스로 사용. 루트에 `.nojekyll` 배치(이미 존재 확인). 모든 리소스 참조(`css/...`, `js/...`, `data/sites.json`, `assets/...`)는 `/`로 시작하지 않는 상대경로만 사용.
- **Rationale**: Constitution IX. Jekyll이 활성화되어 있으면 `_`로 시작하는 파일/폴더를 무시해 배포가 깨질 수 있고, 절대경로(`/css/...`)는 프로젝트 페이지(서브패스 배포) 환경에서 깨진다.
- **Alternatives considered**: `gh-pages` 브랜치 분리 배포 — 별도 빌드/배포 스텝이 필요해 Constitution I(빌드 없음)과 충돌해 기각.
