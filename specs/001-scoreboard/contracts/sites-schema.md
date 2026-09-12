# Contract: `data/sites.json` Schema

이 프로젝트에는 네트워크 API가 없다(정적 사이트, Constitution I). 유일한 "인터페이스"는 콘텐츠 편집자가 채우는 `data/sites.json`과, 그것을 소비하는 `js/main.js` 사이의 데이터 계약이다. 이 문서는 그 계약을 고정한다 — 어느 한쪽만 바뀌면(예: 편집자가 새 필드명을 쓰거나, JS가 필드를 잘못 읽으면) 화면이 깨지므로 이 스키마를 기준으로 양쪽을 맞춘다.

## JSON Schema (informal)

```json
{
  "meta": {
    "title": "string",
    "subtitle": "string",
    "scoreCategories": [
      { "key": "location|land|finance|review|social", "label": "string", "max": "number" }
    ],
    "gradeRule": { "A": "number", "B": "number", "C": "number" }
  },
  "sites": [
    {
      "id": "string (unique)",
      "name": "string",
      "district": "string",
      "area_m2": "number",
      "zoning": "string",
      "units": "number (integer)",
      "stage": "string",
      "image": "string (relative path, no leading '/')",
      "intro": ["string", "string"],
      "scores": {
        "location": "number",
        "land": "number",
        "finance": "number",
        "review": "number",
        "social": "number"
      },
      "total": "number (reference only, recomputed client-side)",
      "grade": "string (reference only, recomputed client-side)"
    }
  ]
}
```

## Consumer contract (`js/main.js`가 지켜야 할 것)

1. `meta.scoreCategories`가 있으면 그 순서/라벨/만점을 사용하고, 없으면 하드코딩된 5항목 기본값으로 폴백한다(현재 구현이 이미 이렇게 함).
2. 각 `Site`의 `total`/`grade`는 절대 그대로 표시하지 않고, `scores`의 5개 값 합계를 `meta.gradeRule`에 적용해 재계산한 값만 표시한다.
3. 재계산 값이 저장된 `total`/`grade`와 다르면 `console.warn(site.name, storedValue, computedValue)` 형태로 로깅한다(화면 렌더링은 막지 않는다).
4. `image` 로드가 실패하면 해당 사업지의 이미지 자리를 surface-1 배경 + 사업지명 텍스트로 대체한다.
5. `intro`는 정확히 2개 문단으로 취급해 렌더링한다(1개나 3개가 와도 배열 그대로 순서대로 출력 — 이 계약은 편집자가 항상 2개를 채우는 것을 전제한다).

## Producer contract (`data/sites.json`을 편집하는 사람이 지켜야 할 것)

1. 사업지 추가/삭제/수정은 이 파일만 편집하면 되고, `index.html`/`js/main.js`를 함께 고칠 필요가 없다(Constitution II).
2. 새 `Site`를 추가할 때 `id`는 기존 항목과 겹치지 않아야 한다.
3. `scores`의 키는 반드시 `meta.scoreCategories[].key`에 정의된 키만 사용한다 — 정의되지 않은 키를 추가해도 화면에 반영되지 않는다.
4. `image` 경로는 `assets/` 기준 상대경로여야 하며 `/`로 시작해서는 안 된다(Constitution IX).
