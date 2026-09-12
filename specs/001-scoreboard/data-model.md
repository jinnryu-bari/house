# Data Model: 신축매입약정 사업지 스코어보드

이 기능의 유일한 데이터 저장소는 `data/sites.json`이다(Constitution II). 아래 엔티티는 이 JSON 파일의 구조를 문서화한 것이며, 서버/DB 스키마가 아니라 정적 파일의 형태다.

## Entity: ScoreCategory (`meta.scoreCategories[]`)

사업지 평가에 쓰이는 5개 고정 평가항목 정의.

| Field | Type | Description | Validation |
|-------|------|--------------|------------|
| `key` | string | 항목 식별자(`location`\|`land`\|`finance`\|`review`\|`social`) | `Site.scores`의 동일 키와 1:1 대응해야 함 |
| `label` | string | 한글 라벨(예: "입지") | 비어있지 않음 |
| `max` | number | 해당 항목 만점 | 5개 항목의 `max` 합계 = 100 (25+20+20+20+15) |

## Entity: GradeRule (`meta.gradeRule`)

합계 점수를 등급으로 매핑하는 구간 규칙.

| Field | Type | Description |
|-------|------|--------------|
| `A` | number | A등급 하한(현재 85) — 이 값 이상이면 A |
| `B` | number | B등급 하한(현재 70) — 이 값 이상 A 미만이면 B |
| `C` | number | C등급 하한(현재 55) — 이 값 이상 B 미만이면 C |
| (D는 값 없음) | — | `C` 미만은 전부 D |

**Derivation rule**: `grade = total >= A ? "A" : total >= B ? "B" : total >= C ? "C" : "D"`

## Entity: Site (`sites[]`)

스코어보드가 평가하는 개별 사업지.

| Field | Type | Description | Validation |
|-------|------|--------------|------------|
| `id` | string | 고유 식별자(예: `changdong-578`) | 파일 내 유일 |
| `name` | string | 표시명(예: "도봉구 창동 578-131·132") | 비어있지 않음, 이미지 로드 실패 시 대체 텍스트에도 사용 |
| `district` | string | 자치구 | — |
| `area_m2` | number | 대지면적(㎡) | 양수 |
| `zoning` | string | 용도지역 | — |
| `units` | number | 예상 세대수 | 정수, 양수 |
| `stage` | string | 진행단계 | — |
| `image` | string | 대표 이미지 상대경로 | `assets/` 기준 상대경로, 절대경로(`/`) 금지. 실사진(항공사진/지도)으로 교체 시 WebP 포맷, 가로/세로 1600px 이하를 따른다(spec.md 비기능 요구사항). 현재 등록된 `assets/*.svg`는 벡터 목업이라 이 규칙의 적용 대상이 아니다 |
| `intro` | string[2] | 소개 문단 정확히 2개 | 배열 길이 = 2 |
| `scores` | object | 5개 평가항목 점수(`location`,`land`,`finance`,`review`,`social`) | 각 값은 0 이상, 해당 `ScoreCategory.max` 이하 |
| `total` | number | (참고용, 저장값) 합계 점수 | **화면 표시에는 사용하지 않음** — `scores` 합으로 재계산한 값과 비교해 다르면 콘솔 경고만 발생 |
| `grade` | string | (참고용, 저장값) 등급 문자 | 위와 동일하게 재계산 값과 비교만 함 |

### Derived (computed, not stored-authoritative)

| Derived Field | Formula | Used For |
|---------------|---------|----------|
| `computedTotal` | `sum(scores.location, scores.land, scores.finance, scores.review, scores.social)` | 화면 표시, 비교 표 기본 정렬 키, 히어로 등급 요약 |
| `computedGrade` | `GradeRule`을 `computedTotal`에 적용 | 화면 표시 등급 배지 |

### State / Lifecycle

`Site`는 정적 JSON 레코드로 상태 전이가 없다. 유일한 "상태"는 페이지 세션 동안의 UI 상태이며 JSON에 저장되지 않는다:

- **씬 활성 상태**(`is-active` 클래스): `ScrollTrigger.onEnter`로 진입 시 1회 부여, 되돌아가지 않음(게이지 재실행 방지).
- **정렬 상태**(`sortState = { key, dir }`, 비교 표 전용): 페이지 세션 동안만 JS 변수에 존재, 새로고침 시 기본값(`{ key: "total", dir: -1 }`, 동점 시 `location` 내림차순 2차 정렬)으로 리셋.

## Relationships

- `Site.scores`의 각 키는 `meta.scoreCategories[].key`와 1:1 대응해야 하며, 정의되지 않은 키는 렌더링되지 않는다.
- `sites[]`의 항목 수가 곧 렌더링되는 사업지 섹션 수이자 비교 표 행 수다(하드코딩된 "4"에 의존하지 않음, spec Edge Case 참조).
