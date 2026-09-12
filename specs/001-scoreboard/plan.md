# Implementation Plan: 신축매입약정 사업지 스코어보드

**Branch**: `001-scoreboard` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-scoreboard/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

4개 사업지(창동·공릉동·창신동·부평)의 입지·사업성 평가를 스크롤 기반 스토리텔링과 정렬 가능한 비교 표로 보여주는 단일 정적 HTML 페이지. 기술 접근: 빌드 없는 순수 HTML/CSS/JS + GSAP ScrollTrigger(CDN)만 추가해 `pin`+`scrub` 씬 전환과 SVG 게이지 애니메이션을 구현하고, 모든 콘텐츠는 `data/sites.json` 하나에서 읽어 렌더링한다. 디자인 토큰은 루트 `DESIGN.md`(Framer)에서 `css/tokens.css`로 1:1 추출하되 폰트(Pretendard)와 한글 자간(-3%)만 예외로 둔다. **이 저장소에는 `index.html`/`css/`/`js/`/`data/sites.json`/`assets/`가 이미 존재하며, 본 계획은 그린필드 설계가 아니라 기존 구현을 스펙 요구사항 대비 점검하고 남은 격차를 좁히는 계획이다** (아래 "기존 구현 갭 분석" 참조).

## Technical Context

**Language/Version**: HTML5, CSS3(커스텀 프로퍼티), Vanilla JavaScript(ES2017+, 브라우저 네이티브 `fetch`/모듈 없는 스크립트) — 트랜스파일 대상 없음

**Primary Dependencies**: GSAP 3.12 + ScrollTrigger 플러그인(cdnjs `<script>` 태그로 로드, npm/번들러 사용 금지) — 이 프로젝트에서 허용된 유일한 외부 스크립트 의존성(Constitution IV)

**Storage**: `data/sites.json` 단일 정적 JSON 파일(런타임에 `fetch`로 읽음). 서버/DB 없음

**Testing**: 자동화 단위/통합 테스트 프레임워크 없음(빌드 없는 정적 사이트 특성상). 검증은 (1) 브라우저 수동 QA(quickstart.md의 시나리오), (2) Lighthouse Performance 감사, (3) `prefers-reduced-motion` 및 375px 뷰포트 수동 확인으로 수행한다

**Target Platform**: GitHub Pages(정적 호스팅, `main` 브랜치 루트)에서 서비스되는 웹 페이지. 최신 에버그린 데스크톱/모바일 브라우저, 최소 지원 폭 375px

**Project Type**: 단일 정적 웹 페이지(빌드 스텝 없음) — Constitution I

**Performance Goals**: Lighthouse Performance 점수 90점 이상(SC-005)

**Constraints**: 빌드 도구/프레임워크/번들러 금지(Constitution I); GSAP 외 추가 외부 라이브러리 금지(Constitution IV); 모든 리소스 참조는 상대경로만 사용, GitHub Pages 루트 배포 + `.nojekyll` 필수(Constitution IX); 디자인 토큰은 `DESIGN.md`에서만 파생(Constitution III); 사업지 데이터는 `data/sites.json` 한 곳에서만(Constitution II); 정렬 상태는 메모리에만 보관, 영속화 금지(Constitution VII)

**Scale/Scope**: 현재 사업지 4건(창동·공릉동·창신동·부평), 사업지 수는 `data/sites.json` 항목 수에 종속(하드코딩된 "4"에 의존하지 않음)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 원칙 | 상태 | 근거 |
|---|------|------|------|
| I | 정적 단일 페이지, 빌드 없음 | PASS | `index.html`/`css/`/`js/`만 존재, 빌드 설정 파일 없음 |
| II | 단일 데이터 소스(`data/sites.json`) | PASS | `js/main.js`가 `fetch("data/sites.json")`로만 사업지 데이터를 읽음, HTML에 하드코딩된 사업지 데이터 없음 |
| III | `DESIGN.md` 디자인 토큰 충실도 | **부분 위반(확인됨)** | `css/tokens.css`의 색/간격/라운드/타이포 값 자체는 `DESIGN.md`와 일치하고 폰트·자간 예외도 문서화되어 있음. 그러나 `gradient-spotlight-card`/`product-mockup-tile`는 코드에서 주석으로만 언급될 뿐 실제 클래스 선택자로 존재하지 않아, "컴포넌트 이름을 클래스명으로 그대로 사용" 요구를 완전히 충족하지 못함 — Phase 2 tasks에서 수정 |
| IV | GSAP ScrollTrigger가 유일한 스크롤 메커니즘 | PASS | `js/main.js`가 `ScrollTrigger.matchMedia`로 데스크톱 `pin`+`scrub`, 모바일 페이드로 분기. `index.html`은 cdnjs `<script>`만 사용, npm 의존성 없음 |
| V | SVG 게이지, 진입 시 1회 | PASS | `stroke-dashoffset` 기반 게이지, `onEnter` 콜백에서 1회 실행 확인됨 |
| VI | 재계산된 점수, JSON 값 무조건 신뢰 금지 | PASS | `total`/`grade`를 `scores` 합계로 재계산하고 불일치 시 `console.warn` 로깅 확인됨 |
| VII | 비교 표 정렬 상태는 메모리에만 | PASS | `sortState` 변수가 모듈 스코프 JS 변수이며 저장소/URL 기록 없음 |
| VIII | 접근성 & 모션 감소 | PASS(부분 재검토 필요) | `prefers-reduced-motion` 분기 존재. `<img>` alt 속성과 이미지 로드 실패 대체 표시(FR-011)는 Phase 1/구현 단계에서 재확인 필요 |
| IX | 상대경로 & GitHub Pages 루트 배포 | PASS | `index.html`의 모든 참조가 `css/...`, `js/...` 상대경로. 루트에 `.nojekyll` 존재 확인됨 |
| X | 등급은 표면 밝기+pill, 색상 아님 | PASS | `tokens.css`에 grade별 hue 토큰 없음, surface lift 방식 주석으로 명시됨 |

**결론**: 게이트 위반 없음. III·VIII은 "재검토 필요" 표시이며 원칙 위반이 아니라 Phase 1에서 세부 확인이 필요한 항목(아래 갭 분석 참조).

## Project Structure

### Documentation (this feature)

```text
specs/001-scoreboard/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── sites-schema.md  # data/sites.json 구조 계약
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html          # 단일 페이지 진입점 — nav, hero, main(scenes-root), ranking, footer
css/
├── tokens.css      # DESIGN.md에서 생성한 커스텀 프로퍼티 + 컴포넌트 토큰 매핑(값만, 레이아웃 없음)
└── style.css       # 레이아웃/컴포넌트 규칙(토큰 위에 구축)
js/
└── main.js         # fetch(data/sites.json) → 렌더링, ScrollTrigger 씬 전환, 게이지, 비교 표 정렬
data/
└── sites.json      # 단일 데이터 소스 — meta(제목, scoreCategories, gradeRule) + sites[]
assets/
├── changdong.svg
├── gongneung.svg
├── changsin.svg
└── bupyeong.svg
.nojekyll           # GitHub Pages Jekyll 처리 비활성화
```

**Structure Decision**: 이미 확립된 구조를 그대로 유지한다(Constitution의 "Additional Constraints"가 이 파일 구조를 고정 목록으로 명시). 새 파일/폴더를 추가하지 않으며, 모든 변경은 기존 5개 파일(+`assets/`) 내부 수정으로 제한한다.

## Implementation Order

1. **`DESIGN.md` 재확인 → `css/tokens.css` 갱신(선행 작업)**: `css/tokens.css`는 이미 존재하지만, 이후 모든 작업(특히 4번 `gradient-spotlight-card`/`product-mockup-tile` 클래스 부여)이 올바른 토큰 값을 전제하므로 `DESIGN.md`를 다시 읽고 `tokens.css`의 색/간격/라운드/타이포/컴포넌트 매핑이 여전히 문서와 1:1인지 확인·갱신하는 것을 첫 단계로 삼는다.
2. `css/style.css`에 `gradient-spotlight-card`/`product-mockup-tile` 클래스를 실제 요소(A등급 카드, 이미지 타일)에 부여(갭 분석 4번).
3. `js/main.js`의 비교 표 정렬에 동점 시 입지 점수 2차 정렬 로직 추가(갭 분석 2번).
4. 이미지 로드 실패 대체 텍스트를 사업지명 포함 형태로 다듬기(갭 분석 1번, 경미).
5. Lighthouse Performance 측정 및 필요 시 폰트 로딩 전략 조정(갭 분석 5번).

이 순서는 `/speckit-tasks`에서 세부 작업(Txxx)으로 그대로 전개된다.

## Complexity Tracking

*Constitution Check에 정당화가 필요한 위반 없음 — 이 표는 비워둔다.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## 기존 구현 갭 분석 (Baseline Gap Analysis)

`index.html`, `css/tokens.css`, `css/style.css`, `js/main.js`, `data/sites.json`, `assets/*.svg`를 spec.md의 FR-001~FR-015, SC-001~SC-007 기준으로 대조한 결과:

### 이미 충족된 항목
- FR-001~FR-002, FR-004~FR-006, FR-007, FR-009, FR-010, FR-012, FR-014, FR-015: 히어로 등급 요약, 씬 순서/전환(`ScrollTrigger` pin+scrub), 진입 애니메이션(이미지 스케일, 게이지 `stroke-dashoffset` 1회), 비교 표 렌더/재정렬, 상단 nav 스크롤 이동, 점수 재계산+콘솔 경고, 등급의 문자+surface-lift 표시, `prefers-reduced-motion` 분기, `data/sites.json` 단일 소스 — 모두 `js/main.js`/`css/tokens.css`에서 확인됨.
- 파일 구조, GSAP CDN 로드 방식, 상대경로, `.nojekyll` — 모두 요청된 제약과 일치.

### 확인된 격차(Gap) — Phase 2(tasks) 대상
1. **FR-011 (이미지 로딩 실패 대체 표시) — 이미 구현됨, 문구만 경미하게 상이**: `js/main.js`가 `<img>` `error` 이벤트에서 `.scene-photo-missing`을 노출하고 `.scene-bg-fill`이 `var(--surface-1)` 그라디언트 배경을 이미 깔고 있어 요구사항의 핵심(대체 배경 + 안내 텍스트)은 충족된다. 다만 대체 텍스트가 "사업지명"이 아니라 "사진 준비 중 · {image 경로}"를 보여준다(사업지명 자체는 섹션 제목에 이미 표시되어 있어 실질적 정보 손실은 없음) — 스펙 문구에 더 정확히 맞추려면 텍스트를 사업지명 포함 형태로 다듬는 정도의 경미한 수정만 필요.
2. **FR-005 동점 타이브레이크(입지 점수 우선)**: `renderRanking()`의 정렬 비교 함수가 단순 뺄셈만 사용해 `total` 동점 시 원래 배열 순서를 따른다(입지 점수 기준 2차 정렬 없음). 기본 정렬(`sortState.key === "total"`)일 때 동점자는 `location` 점수 내림차순으로 2차 정렬하는 로직을 추가해야 한다.
3. **비기능: 이미지 형식(WebP, 1600px 이하)**: 현재 `assets/*.svg`는 벡터 목업 이미지이며 WebP 요구사항과 무관한 포맷이다. 실제 항공사진/지도 이미지로 교체 시 WebP·1600px 이하 규칙을 적용해야 하며, 현재는 SVG 플레이스홀더이므로 규칙 자체가 적용 대상이 아님 — 실사진 자산이 준비되면 별도 작업으로 처리(이 feature의 tasks 범위에는 "자산 포맷 가이드 문서화"만 포함).
4. **Constitution III 위반(확인됨) — `gradient-spotlight-card`/`product-mockup-tile` 클래스 미사용**: `css/style.css`를 전수 검색한 결과 `gradient-spotlight-card`, `product-mockup-tile`는 **주석에서만 언급**될 뿐 실제 CSS 클래스 선택자나 `index.html`/`js/main.js`가 생성하는 요소의 `class` 속성으로는 존재하지 않는다(A등급 카드와 이미지 타일이 다른 이름의 클래스로 구현되어 있을 가능성이 높음). Constitution III는 "`DESIGN.md`의 `components:` 블록 키를 반드시 그 이름 그대로 CSS 클래스명으로 사용"을 요구하므로, 이는 문서상 의도와 실제 코드 사이의 불일치다. Phase 2에서 A등급 카드/이미지 타일에 실제로 `gradient-spotlight-card`/`product-mockup-tile` 클래스를 부여하는 리네이밍 작업이 필요하다.
5. **Lighthouse Performance ≥ 90 (SC-005)**: 현재 수치 미측정. Google Fonts(Inter) + Pretendard CDN 두 곳에서 웹폰트를 로드하고 있어(`index.html` `<link>` 2세트) 성능에 영향을 줄 수 있음 — 실측 후 필요 시 폰트 로딩 전략(preload, font-display) 조정이 필요할 수 있다.
6. **`<img>` alt 속성(FR-013) — 이미 충족됨**: `js/main.js`가 생성하는 `<img class="scene-photo" ... alt="${site.name} 항공사진/지도">`에서 모든 이미지에 사업지명을 포함한 alt가 항상 채워짐을 확인했다. 별도 작업 불필요.

이 갭들은 모두 기존 구조를 유지한 채 `js/main.js`/`css/style.css` 내부 수정만으로 해결 가능하며, 파일 구조·의존성·Constitution 원칙에 대한 예외를 요구하지 않는다.

## Post-Design Constitution Check (재확인)

Phase 1 설계 산출물(data-model.md, contracts/sites-schema.md)을 반영해도 새로운 원칙 위반은 발생하지 않는다. 갭 분석 1~6번은 모두 원칙 위반이 아니라 기존 구현의 미완성/미검증 항목이며, `/speckit-tasks`에서 구체적 작업으로 전환한다.
