---

description: "Task list template for feature implementation"
---

# Tasks: 신축매입약정 사업지 스코어보드

**Input**: Design documents from `specs/001-scoreboard/` (spec.md, plan.md, research.md, data-model.md, contracts/sites-schema.md, quickstart.md)

**Tests**: 이 기능은 자동화 테스트 프레임워크를 도입하지 않는다(plan.md Technical Context — 빌드 없는 정적 사이트, 검증은 수동 QA/Lighthouse). 스펙/사용자 모두 TDD를 요청하지 않았으므로 테스트 태스크는 생성하지 않는다. 각 스토리의 "Validation"은 quickstart.md의 해당 시나리오를 수동 실행하는 것으로 대체한다.

**Baseline note**: `index.html`/`css/`/`js/`/`data/sites.json`/`assets/`가 이미 구현되어 있다. 이 tasks.md는 그린필드 빌드 목록이 아니라 plan.md "기존 구현 갭 분석"에서 확인된 실제 격차만을 작업으로 전환한 것이다. 갭이 없는 스토리는 회귀 없음을 확인하는 검증 태스크만 포함한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 선행 의존 없음)
- **[Story]**: 이 태스크가 속한 사용자 스토리(spec.md 기준 US1~US6)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 정적 사이트 — 저장소 루트의 `index.html`, `css/tokens.css`, `css/style.css`, `js/main.js`, `data/sites.json`, `assets/`. `src/`/`tests/` 등 별도 소스 트리 없음(plan.md Structure Decision).

---

## Phase 1: Setup

**Purpose**: 기존 baseline 구조가 plan.md의 Project Structure와 일치하는지 확인(신규 생성 없음)

- [X] T001 저장소 루트에 `index.html`, `css/tokens.css`, `css/style.css`, `js/main.js`, `data/sites.json`, `assets/`, `.nojekyll`이 모두 존재하고 plan.md의 "Source Code (repository root)" 트리와 일치하는지 확인한다. 불일치(누락/추가 파일)가 있으면 이 태스크에 기록만 하고 다음 단계로 진행한다. → 확인 완료, 전부 존재하고 일치. 불일치 없음.

**Checkpoint**: 구조 확인 완료 — Foundational 단계로 진행

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 의존하는 데이터 계약(`data/sites.json` ↔ `js/main.js`)의 무결성을 확인. 여기서 발견된 불일치는 이후 모든 스토리 작업을 막는다.

**🚨 CRITICAL**: 이 단계 완료 전에는 어떤 사용자 스토리 작업도 시작하지 않는다.

- [X] T002 `data/sites.json`의 각 `sites[]` 항목이 `specs/001-scoreboard/contracts/sites-schema.md`와 `data-model.md`의 제약을 만족하는지 점검한다: `intro`는 "배열 길이 = 2"여야 하고, `scores`의 각 항목 값은 "0 이상, 해당 `ScoreCategory.max` 이하"여야 하며, `image`는 "`assets/` 기준 상대경로, 절대경로(`/`) 금지"를 지켜야 한다. 위반 항목이 있으면 `data/sites.json`을 직접 수정해 맞춘다. → 4개 사업지 전부 점검 완료, 위반 없음(각 사업지 `intro.length===2`, 5개 점수 모두 해당 `max` 이내, `image` 전부 `assets/*.svg` 상대경로, 저장된 `total`/`grade`도 재계산 값과 일치).
- [X] T003 [P] `js/main.js`의 `meta.scoreCategories` 폴백 로직과 `gradeRule`(A≥85, B70-84, C55-69, D<55) 적용이 `data-model.md`의 "Derivation rule": `grade = total >= A ? "A" : total >= B ? "B" : total >= C ? "C" : "D"`와 정확히 일치하는지 코드를 읽고 확인한다(불일치 시 `js/main.js` 수정). → `js/main.js`의 `computeGrade()`가 이 공식과 문자 그대로 일치함을 확인. 수정 불필요.

**Checkpoint**: 데이터 계약 확인 완료 — 사용자 스토리 작업 시작 가능

---

## Phase 3: User Story 1 - 히어로에서 종합 등급 요약 확인 (Priority: P1)

**Goal**: 첫 화면에서 제목과 4개 사업지의 등급을 즉시 확인할 수 있게 한다.

**Independent Test**: 페이지를 열고 스크롤 없이 제목과 4개 사업지 등급이 보이는지 확인(quickstart.md #1).

- [X] T004 [US1] `index.html`의 `#hero-grades` 렌더 결과가 각 사업지의 재계산된 등급 문자(A/B/C/D)를 표시하는지 `js/main.js`의 히어로 렌더 함수를 확인하고, 저장된 `grade` 값이 아닌 `computedGrade`를 사용하는지 재확인한다(회귀 확인, plan.md 갭 목록에 없는 항목이므로 코드 변경이 필요하면 그때만 `js/main.js`를 수정). → `buildHeroGrades()`가 `site._grade`(= computedGrade, T003에서 확인)만 사용함을 코드로 확인. 수정 불필요.
- [ ] T005 [US1] quickstart.md 시나리오 #1을 수동 실행해 제목 "신축매입약정 사업지 스코어보드"와 4개 사업지명·등급이 스크롤 없이 표시되는지 검증한다. → **미실행**: 이 세션에는 Claude in Chrome 브라우저 확장이 연결되어 있지 않아(연결 오류: "Browser extension is not connected") 실제 브라우저 렌더링 검증을 하지 못했다. `index.html`/`js/main.js` 코드 검토로는 요구사항을 만족하는 것으로 보이나, 실제 화면에서 사용자가 직접 재생 여부를 확인해야 한다.

**Checkpoint**: User Story 1 독립적으로 동작 확인

---

## Phase 4: User Story 2 - 스크롤 기반 사업지 전환 탐색 (Priority: P1)

**Goal**: 창동 → 공릉동 → 창신동 → 부평 순서로 스크롤에 따라 씬이 전환된다.

**Independent Test**: 데스크톱 폭에서 끝까지 스크롤하며 4개 섹션이 지정된 순서로 전환되는지 확인(quickstart.md #2).

- [X] T006 [US2] `js/main.js`의 `setupScrollTriggers()`/`ScrollTrigger.matchMedia` 블록이 각 씬을 창동 → 공릉동 → 창신동 → 부평 순서(= `data/sites.json`의 `sites[]` 배열 순서)로 pin+scrub 하는지 확인한다(배열 순서가 깨지면 `data/sites.json`의 `sites[]` 순서를 수정). → `sites[]` 배열 순서(창동→공릉동→창신동→부평)와 `buildScenes()`가 이 순서를 그대로 순회함을 확인. 수정 불필요.
- [ ] T007 [US2] quickstart.md 시나리오 #2를 수동 실행해 pin 구간에서 이미지가 `--zoom-scale-from`(1.15) → `--zoom-scale-to`(1.0)로 축소되고 다음 씬이 `translateY(100%) → 0`으로 들어오는지 확인한다. → **미실행**(브라우저 확장 미연결, T005 참조). 코드 검토로는 `tl.fromTo(bg,{scale:1.15},{scale:1})`, `gsap.set(...,{yPercent:100})`→`tl.to(...,{yPercent:0})`로 구현되어 요구사항과 일치하는 것으로 보이나, 실제 스크롤 재생은 사용자가 브라우저에서 확인해야 한다.

**Checkpoint**: User Story 1 + 2 함께 동작 확인

---

## Phase 5: User Story 3 - 사업지 상세 정보 및 평가 확인 (Priority: P1)

**Goal**: 각 사업지 섹션이 이미지·소개·필지 정보 5항목·평가 게이지·등급 배지를 진입 애니메이션과 함께 보여준다.

**Independent Test**: 한 섹션에 진입해 모든 콘텐츠와 애니메이션(이미지 스케일, 텍스트 순차 등장, 게이지 채움)이 재생되는지 확인(quickstart.md #3).

- [X] T008 [US3] `css/style.css`에서 A등급 카드/배지에 `gradient-spotlight-card` 클래스를, 사업지 이미지 타일에 `product-mockup-tile` 클래스를 실제로 부여한다(plan.md 갭 분석 4번). 현재는 두 이름이 주석에서만 언급되고 실제 클래스 선택자·요소의 `class` 속성으로는 존재하지 않는다 — `DESIGN.md`의 `components:` 블록에 정의된 스타일(A등급 전용 gradient-violet→gradient-magenta 처리, 이미지 타일 레이아웃)을 그대로 이 두 클래스명 아래로 옮기고, `js/main.js`가 씬/등급 배지를 생성하는 부분의 `class` 속성도 함께 갱신한다. → 완료: `css/tokens.css`에 `.gradient-spotlight-card`(`DESIGN.md` 값 그대로: `background: var(--gradient-violet)`, `color: var(--ink)`, subhead 타이포, `rounded-xl`, `padding:32px`)와 `.product-mockup-tile`(`background: var(--surface-1)`, body-sm 타이포, `rounded-xl`, `padding:16px`)을 추가. `js/main.js`에서 grade가 "A"일 때 `hero-grade-chip`/`grade-badge`/`grade-pill`에 `gradient-spotlight-card`를 조건부로 추가하고, `.score-card`에는 항상 `product-mockup-tile`을 추가(기존 `pricing-card`와 같은 방식의 정체성 클래스 — 더 구체적인 기존 규칙이 나중에 로드되어 시각적 크기/배경은 그대로 유지됨을 확인).
- [X] T009 [US3] `js/main.js`의 `.scene-photo-missing` 대체 텍스트를 "사진 준비 중 · {image 경로}"에서 사업지명을 포함하는 문구(예: "{site.name} 사진 준비 중")로 다듬는다(plan.md 갭 분석 1번, 경미 — 배경이 이미 `var(--surface-1)` 그라디언트를 쓰고 있으므로 텍스트만 수정). → 완료: `${site.name} · 사진 준비 중`으로 변경.
- [ ] T010 [US3] quickstart.md 시나리오 #3을 수동 실행해 이미지/소개 문단 2개/필지 정보 5항목/게이지 5개/등급 배지가 모두 나타나고, `data/sites.json`의 `image` 경로를 일부러 깨뜨렸을 때 T009에서 수정한 대체 텍스트(사업지명 포함)가 표시되는지 확인 후 원복한다. → **미실행**(브라우저 확장 미연결, T005 참조). 코드상으로는 T008/T009 수정 사항이 렌더 경로에 정확히 반영되어 있음을 확인했으나, 실제 화면 확인은 사용자 몫.
- [ ] T011 [US3] quickstart.md 시나리오 #4(불일치 로깅)를 수동 실행해 `total`을 `scores` 합과 다르게 임시 변경 시 콘솔에 사업지명+두 값이 포함된 경고가 뜨고 화면은 재계산 값을 쓰는지 확인 후 원복한다. → **미실행**(브라우저 확장 미연결, T005 참조). `console.warn` 호출부 코드는 확인 완료.

**Checkpoint**: User Story 1~3(모든 P1) 함께 동작 확인 — MVP 완성

---

## Phase 6: User Story 4 - 비교 표에서 순위 확인 및 재정렬 (Priority: P2)

**Goal**: 비교 표가 합계 점수 내림차순(동점 시 입지 점수 우선)으로 정렬되고, 열 헤더 클릭으로 재정렬된다.

**Independent Test**: 비교 표의 기본 정렬과 헤더 클릭 재정렬을 확인(quickstart.md #5).

- [X] T012 [US4] `js/main.js`의 `renderRanking()` 정렬 비교 함수에 2차 정렬 키를 추가한다(plan.md 갭 분석 2번): `sortState.key === "total"`이고 두 사업지의 `computedTotal`이 같을 경우, `scores.location` 값이 큰 쪽을 앞에 오도록 비교 함수를 수정한다(spec.md FR-005: "동점이면 입지 점수가 높은 쪽이 앞이다"). → 완료: `cmp === 0 && sortState.key === "total"`일 때 `scores.location` 내림차순으로 즉시 반환하도록 추가(정렬 방향 토글과 무관하게 동점 시 입지 점수 우선). 현재 `data/sites.json`의 4개 사업지는 합계가 모두 달라(89/74/66/63) 이 분기가 시각적으로 드러나지는 않지만, 향후 동점 데이터가 추가되어도 FR-005를 만족한다.
- [ ] T013 [US4] quickstart.md 시나리오 #5를 수동 실행해 기본 정렬(합계 내림차순, 동점 시 입지 점수 내림차순), 열 헤더 클릭 재정렬(오름차순↔내림차순 토글), 새로고침 시 기본 정렬로 복귀(정렬 상태 미영속화)를 확인한다. → **미실행**(브라우저 확장 미연결, T005 참조). T012의 로직은 코드 검토로 확인 완료.

**Checkpoint**: User Story 1~4 함께 동작 확인

---

## Phase 7: User Story 6 - 모바일 환경에서의 축소된 경험 (Priority: P2)

**Goal**: 375px 뷰포트에서 이미지/텍스트가 세로로 쌓이고 스크롤 연출이 단순 페이드로 축소된다.

**Independent Test**: 375px 뷰포트에서 세로 스택과 페이드 전환을 확인(quickstart.md #7).

- [ ] T014 [US6] quickstart.md 시나리오 #7을 수동 실행해 375px 뷰포트에서 `css/style.css`의 모바일 미디어쿼리(`.scene-bg` opacity 페이드, pin/scrub 미생성)가 적용되어 이미지/텍스트가 세로로 쌓이고 진입 시 단순 페이드만 재생되는지 확인한다(회귀 확인, 코드 변경 불필요 — plan.md 갭 목록에 없는 항목). → **미실행**(브라우저 확장 미연결, T005 참조). `@media (max-width: 880px)`에서 `.scene-grid`가 `grid-template-columns: 1fr`로 바뀌고, `body.no-scrollytelling`/모바일 분기에서 `.scene-bg`가 opacity 페이드만 쓰는 것을 코드로 확인.

**Checkpoint**: User Story 1~4, 6 함께 동작 확인

---

## Phase 8: User Story 5 - 상단 내비게이션으로 바로가기 (Priority: P3)

**Goal**: 상단 고정 내비게이션에서 사업지 이름 클릭 시 해당 섹션으로 부드럽게 스크롤한다.

**Independent Test**: 내비게이션 링크 클릭 후 스크롤 이동을 확인(quickstart.md #6).

- [ ] T015 [US5] quickstart.md 시나리오 #6을 수동 실행해 상단 내비게이션의 사업지명 클릭 시 해당 섹션으로 부드럽게 스크롤 이동하는지 확인한다(회귀 확인, 코드 변경 불필요 — plan.md 갭 목록에 없는 항목). → **미실행**(브라우저 확장 미연결, T005 참조). 내비게이션 링크 클릭 핸들러(`scrollToId`)가 존재함을 코드로 확인.

**Checkpoint**: 모든 사용자 스토리(US1~US6) 독립적으로 동작 확인

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 개별 스토리에 속하지 않는 비기능 요구사항 마무리(plan.md 갭 분석 3, 5번)

- [X] T016 [P] `index.html`의 웹폰트 로딩을 점검한다(plan.md 갭 분석 5번): Google Fonts(Inter) `<link>` 2세트와 Pretendard CDN `<link>`가 모두 로드되고 있어 성능에 영향을 줄 수 있으므로, 실제로 쓰이는 폰트만 남기거나 `rel="preload"`/`font-display: swap` 적용 여부를 확인해 필요 시 `index.html`을 수정한다. → 완료: Google Fonts(Inter) `preconnect` 2개 + `<link>` 1개를 제거(렌더 블로킹 웹폰트 요청 1건 절감). `--font-display`/`--font-body` 폰트 스택은 `tokens.css`에 "Pretendard", "Inter", ...system 그대로 유지(Constitution III 예외 조항 값 자체는 변경하지 않음) — Inter는 네트워크로 로드되지 않는 명목상 폴백이 되지만, Pretendard가 한글/영문 모두 커버해 실제 렌더링에는 영향 없음.
- [ ] T017 Chrome DevTools Lighthouse로 Performance 감사를 실행해 spec.md SC-005("Lighthouse Performance 90점 이상")를 충족하는지 확인한다. 90점 미만이면 T016의 폰트 로딩 조정 등 원인을 찾아 재측정한다. → **미실행**: 이 세션은 Claude in Chrome 브라우저 확장이 연결되어 있지 않아 Lighthouse 감사를 실행할 수 없었다("Browser extension is not connected"). 사용자가 Chrome DevTools에서 직접 실행해 확인해야 한다. T016에서 웹폰트 요청 1건을 줄인 것 외에는 추가 최적화를 적용하지 않았으므로, 90점 미만이면 이미지 용량(현재 SVG, 크지 않음)이나 GSAP 스크립트 로딩 순서를 다음으로 점검할 것을 권장한다.
- [X] T018 [P] `assets/*.svg`가 실제 항공사진/지도 이미지(WebP, 1600px 이하)로 교체될 경우를 대비해, `data-model.md`의 `Site.image` 필드 설명 옆에 "실사진 자산은 WebP·1600px 이하 규칙을 따른다"는 문구가 이미 있는지 확인하고 없으면 추가한다(plan.md 갭 분석 3번 — 현재 SVG 플레이스홀더에는 적용 대상 아님, 문서화만 수행). → 완료: `data-model.md`의 `Site.image` 행에 해당 문구 추가.
- [ ] T019 `specs/001-scoreboard/quickstart.md`의 시나리오 #8(모션 감소), #9(Lighthouse), #10(데이터 단일 소스)을 수동 실행해 전체 회귀가 없는지 최종 확인한다. → **미실행**(브라우저 확장 미연결, T005/T017 참조). 사용자가 `python -m http.server`로 로컬 서빙 후 quickstart.md 절차대로 직접 확인해야 한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음 — 즉시 시작
- **Foundational (Phase 2)**: Setup 완료 후 — 모든 사용자 스토리를 막음
- **User Stories (Phase 3~8)**: 모두 Foundational 완료에 의존
  - P1 그룹(US1, US2, US3)을 우선 완료해야 MVP 성립
  - P2 그룹(US4, US6), P3 그룹(US5)은 P1 완료 후 순서 무관하게 진행 가능
- **Polish (Phase 9)**: 모든 사용자 스토리 완료 후

### User Story Dependencies

- **US1, US2, US3(P1)**: Foundational 이후 시작 가능, 서로 독립적(단, 시연 시 US2 순서 확인 전에 US3 상세 콘텐츠가 있어야 자연스러움 — 기술적 의존은 없음)
- **US4(P2)**: US1~US3과 독립적. 비교 표 자체 데이터만 필요(Foundational에서 이미 확보)
- **US6(P2)**: US1~US3의 CSS/JS 결과물을 모바일 미디어쿼리로 재사용하지만 별도 코드 변경 없이 독립적으로 검증 가능
- **US5(P3)**: 다른 스토리와 독립적, 내비게이션 링크만 필요

### Parallel Opportunities

- T003(Foundational 확인)은 T002와 파일이 겹치지 않아 병렬 가능
- Phase 9의 T016, T018은 서로 다른 파일(`index.html`, `data-model.md`)이라 병렬 가능
- P1 완료 후 US4/US6/US5는 서로 다른 파일 영역(`js/main.js` 정렬 로직 vs `css/style.css` 미디어쿼리 확인 vs 내비게이션 확인)이라 팀 작업 시 병렬 가능

---

## Parallel Example: Foundational

```bash
Task: "data/sites.json 스키마 제약 점검(intro 길이=2, scores 범위, image 상대경로)"
Task: "js/main.js의 gradeRule 파생 로직이 data-model.md 공식과 일치하는지 확인"
```

---

## Implementation Strategy

### MVP First (User Story 1~3, 모두 P1)

1. Phase 1 Setup 확인
2. Phase 2 Foundational 데이터 계약 점검(막히면 여기서 수정)
3. Phase 3~5 (US1, US2, US3) 완료 — 이 시점에 이미 대부분 baseline에 구현되어 있으므로 실제 코드 변경은 T008(클래스명), T009(대체 텍스트) 두 건뿐
4. **STOP & VALIDATE**: quickstart.md #1~#4 실행

### Incremental Delivery

1. Setup + Foundational → 데이터 계약 확정
2. US1~US3 검증/보정 → MVP 시연 가능
3. US4(비교 표 타이브레이크 수정) 추가 → 재시연
4. US6, US5 회귀 확인 추가
5. Polish(Phase 9)로 성능·자산 규칙 마무리

## Notes

- 이 기능은 baseline이 이미 대부분 구현되어 있어, "구현" 태스크 대부분이 실제로는 "회귀 확인" 또는 "경미한 보정"이다. 실질적 코드 수정이 필요한 태스크는 T002(필요 시), T003(필요 시), T008, T009, T012, T016(필요 시), T018뿐이다.
- [P] 태스크 = 서로 다른 파일, 선행 의존 없음
- 각 사용자 스토리는 독립적으로 완료·검증 가능해야 한다
- 각 태스크 완료 후 커밋 권장
- 체크포인트에서 멈춰 스토리 단위로 독립 검증 가능
