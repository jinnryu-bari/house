(() => {
  "use strict";

  // Motion constants — must match css/tokens.css
  const GAUGE_DURATION_S = 0.9;
  const TOTAL_DURATION_MS = 900;
  const DESKTOP_MEDIA = "(min-width: 641px)";
  const GAUGE_LINE_LENGTH = 100; // matches the gauge SVG viewBox width (0..100)

  // 등급은 색이 아니라 grade-{a|b|c|d}-color 클래스(surface lift + pill)로만
  // 구분한다 — 색상 매핑 없음 (DESIGN.md Don't: 강조색은 하나만).
  const GRADE_RULE = { A: 85, B: 70, C: 55 }; // D otherwise
  const GRADE_RANK = { A: 4, B: 3, C: 2, D: 1 };

  const RANKING_COLUMNS = [
    { key: "name", label: "사업지", type: "text", get: s => s.name },
    { key: "district", label: "구", type: "text", get: s => s.district },
    { key: "area_m2", label: "대지면적(㎡)", type: "number", get: s => s.area_m2 },
    { key: "units", label: "예상 세대수", type: "number", get: s => s.units },
    { key: "stage", label: "진행단계", type: "text", get: s => s.stage },
    { key: "total", label: "종합 점수", type: "number", get: s => s._total },
    { key: "grade", label: "등급", type: "number", get: s => GRADE_RANK[s._grade] || 0 }
  ];

  const nav = document.getElementById("site-nav");
  const navLinks = document.getElementById("site-nav-links");
  const heroGrades = document.getElementById("hero-grades");
  const scenesRoot = document.getElementById("scenes-root");
  const rankingHeadRow = document.getElementById("ranking-head-row");
  const rankingBody = document.querySelector("#ranking-table tbody");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let sites = [];
  let categories = [];
  let sceneEls = [];
  // 비교 표 정렬 상태 — 메모리에만 존재, 새로고침하면 기본 정렬로 되돌아간다 (Constitution VII)
  let sortState = { key: "total", dir: -1 };

  fetch("data/sites.json")
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(json => {
      sites = json.sites || [];
      categories = (json.meta && json.meta.scoreCategories) || [
        { key: "location", label: "입지", max: 25 },
        { key: "land", label: "토지 조건", max: 20 },
        { key: "finance", label: "사업성", max: 20 },
        { key: "review", label: "심의 통과 가능성", max: 20 },
        { key: "social", label: "사회적 가치", max: 15 }
      ];

      annotateComputedScores(sites);
      buildNav(sites);
      buildHeroGrades(sites);
      buildScenes(sites);
      buildRankingHead();
      renderRanking();

      if (prefersReduced) {
        // Constitution VIII: 모든 애니메이션(핀/스크럽/게이지)을 끄고 최종 상태를 즉시 렌더링
        document.body.classList.add("no-scrollytelling");
        activateAllImmediately();
      } else {
        setupScrollTriggers();
      }
    })
    .catch(err => {
      console.error("사업지 데이터를 불러오지 못했습니다.", err);
      scenesRoot.innerHTML =
        '<div class="load-error" style="min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;color:#c8544a;">' +
        '<div><p style="font-weight:700;font-size:18px;margin-bottom:8px;">데이터를 불러오지 못했습니다.</p>' +
        '<p style="color:#9298a3;font-size:14px;max-width:480px;">브라우저에서 파일을 직접 열면(file://) data/sites.json을 읽지 못할 수 있습니다.<br>로컬 서버(예: <code>npx serve</code>, VS Code Live Server)로 실행해 주세요.</p></div></div>';
    });

  // ------------------------------------------------------------------
  // Score recomputation — scores 합으로 total/grade 재계산, 불일치 시 경고
  // (Constitution VI)
  // ------------------------------------------------------------------

  function computeTotal(scores) {
    return Object.values(scores || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  function computeGrade(total) {
    if (total >= GRADE_RULE.A) return "A";
    if (total >= GRADE_RULE.B) return "B";
    if (total >= GRADE_RULE.C) return "C";
    return "D";
  }

  function annotateComputedScores(list) {
    list.forEach(site => {
      const computedTotal = computeTotal(site.scores);
      const computedGrade = computeGrade(computedTotal);
      const storedGrade = (site.grade || "").toUpperCase();

      if (typeof site.total === "number" && site.total !== computedTotal) {
        console.warn(
          `[sites.json] "${site.name}"의 total(${site.total})이 scores 합계(${computedTotal})와 다릅니다. 화면에는 재계산된 값을 사용합니다.`
        );
      }
      if (storedGrade && storedGrade !== computedGrade) {
        console.warn(
          `[sites.json] "${site.name}"의 grade(${storedGrade})가 재계산된 등급(${computedGrade})과 다릅니다. 화면에는 재계산된 값을 사용합니다.`
        );
      }

      site._total = computedTotal;
      site._grade = computedGrade;
    });
  }

  // ------------------------------------------------------------------
  // Nav
  // ------------------------------------------------------------------

  function buildNav(list) {
    navLinks.innerHTML = list.map(site => `
      <li><a href="#${site.id}" data-target="${site.id}">${site.name}</a></li>
    `).join("") + `<li><a href="#ranking" data-target="ranking" class="site-nav-compare">비교</a></li>`;

    navLinks.addEventListener("click", e => {
      const a = e.target.closest("a[data-target]");
      if (!a) return;
      e.preventDefault();
      scrollToId(a.dataset.target);
    });
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const navH = nav.offsetHeight;
    const top = el.getBoundingClientRect().top + window.pageYOffset - navH;
    window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
  }

  // ------------------------------------------------------------------
  // Hero grade summary
  // ------------------------------------------------------------------

  function buildHeroGrades(list) {
    heroGrades.innerHTML = list.map(site => `
      <a class="hero-grade-chip grade-${site._grade.toLowerCase()}-color${site._grade === "A" ? " gradient-spotlight-card" : ""}" href="#${site.id}" data-target="${site.id}">
        <span class="hero-grade-letter">${site._grade}</span>
        <span class="hero-grade-name">${site.name}<small>${site._total}점</small></span>
      </a>
    `).join("");

    heroGrades.addEventListener("click", e => {
      const a = e.target.closest("a[data-target]");
      if (!a) return;
      e.preventDefault();
      scrollToId(a.dataset.target);
    });
  }

  // ------------------------------------------------------------------
  // Build scenes
  // ------------------------------------------------------------------

  function fmtNum(n) {
    return new Intl.NumberFormat("ko-KR").format(n);
  }

  function buildGaugeSvg(fillRatio) {
    const dash = GAUGE_LINE_LENGTH;
    const hiddenOffset = dash; // 0% filled at build time
    return `
      <svg class="gauge-svg" viewBox="0 0 ${GAUGE_LINE_LENGTH} 8" preserveAspectRatio="none" aria-hidden="true">
        <line class="gauge-track-line" x1="0" y1="4" x2="${GAUGE_LINE_LENGTH}" y2="4" stroke-width="8" stroke-linecap="round"/>
        <line class="gauge-fill-line" x1="0" y1="4" x2="${GAUGE_LINE_LENGTH}" y2="4" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${dash}" stroke-dashoffset="${hiddenOffset}" data-fill-ratio="${fillRatio.toFixed(4)}"/>
      </svg>
    `;
  }

  function buildScenes(list) {
    const frag = document.createDocumentFragment();
    list.forEach((site, i) => {
      const g = site._grade;

      const scene = document.createElement("section");
      scene.className = "scene";
      scene.id = site.id;
      scene.dataset.index = i;
      scene.style.zIndex = String(i + 1);
      scene.setAttribute("aria-label", `${site.district} ${site.name}`);

      const gaugesHtml = categories.map(cat => {
        const value = (site.scores && site.scores[cat.key]) || 0;
        const fill = cat.max ? value / cat.max : 0;
        return `
          <div class="gauge-row" data-target="${value}">
            <span class="gauge-name">${cat.label}</span>
            <span class="gauge-track">${buildGaugeSvg(fill)}</span>
            <span class="gauge-value"><span class="js-val">0</span><small>/${cat.max}</small></span>
          </div>
        `;
      }).join("");

      scene.innerHTML = `
        <div class="scene-bg">
          <div class="scene-bg-fill"></div>
          <img class="scene-photo" src="${site.image}" alt="${site.name} 항공사진/지도" loading="lazy">
          <div class="scene-photo-missing" hidden>${site.name} · 사진 준비 중</div>
        </div>
        <div class="scene-scrim"></div>
        <div class="scene-content">
          <div class="scene-grid">
            <div class="scene-text">
              <div class="scene-kicker">
                <span class="scene-index">0${i + 1} / 0${list.length}</span>
                <span class="scene-district">${site.district}</span>
              </div>
              <h2 class="scene-name">${site.name}</h2>
              <div class="scene-paragraphs">
                ${(site.intro || []).map(p => `<p>${p}</p>`).join("")}
              </div>
              <dl class="scene-parcel">
                <div><dt>지번</dt><dd>${site.name}</dd></div>
                <div><dt>대지면적</dt><dd>${fmtNum(site.area_m2)}㎡</dd></div>
                <div><dt>용도지역</dt><dd>${site.zoning}</dd></div>
                <div><dt>예상 세대수</dt><dd>${site.units}세대</dd></div>
                <div><dt>진행단계</dt><dd>${site.stage}</dd></div>
              </dl>
            </div>
            <div class="score-card pricing-card product-mockup-tile">
              <div class="score-card-head">
                <span class="score-card-label">종합 스코어</span>
                <span class="grade-badge grade-${g.toLowerCase()}-color${g === "A" ? " gradient-spotlight-card" : ""}">
                  <span class="grade-letter">${g}</span>
                  <span class="grade-total"><span class="js-total">0</span>/100점</span>
                </span>
              </div>
              <div class="gauge-list">${gaugesHtml}</div>
            </div>
          </div>
        </div>
        <div class="scene-caption">${site.stage}</div>
      `;

      const img = scene.querySelector(".scene-photo");
      const missingLabel = scene.querySelector(".scene-photo-missing");
      img.addEventListener("error", () => {
        img.style.display = "none";
        missingLabel.hidden = false;
      }, { once: true });

      frag.appendChild(scene);
    });
    scenesRoot.appendChild(frag);
    sceneEls = Array.from(scenesRoot.querySelectorAll(".scene"));
  }

  // ------------------------------------------------------------------
  // Ranking table — sortable columns, in-memory sort state (Constitution VII)
  // ------------------------------------------------------------------

  function buildRankingHead() {
    const cells = ['<th class="col-no">No.</th>'].concat(
      RANKING_COLUMNS.map(col => `
        <th class="col-${col.key}" data-key="${col.key}">
          <button type="button" class="sort-btn" data-key="${col.key}">
            <span>${col.label}</span>
            <span class="sort-indicator" aria-hidden="true"></span>
          </button>
        </th>
      `)
    );
    rankingHeadRow.innerHTML = cells.join("");

    rankingHeadRow.addEventListener("click", e => {
      const btn = e.target.closest(".sort-btn");
      if (!btn) return;
      const key = btn.dataset.key;
      if (sortState.key === key) {
        sortState.dir *= -1;
      } else {
        const col = RANKING_COLUMNS.find(c => c.key === key);
        sortState = { key, dir: col && col.type === "text" ? 1 : -1 };
      }
      renderRanking();
    });
  }

  function renderRanking() {
    const col = RANKING_COLUMNS.find(c => c.key === sortState.key);
    const sorted = sites.slice().sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      let cmp;
      if (typeof av === "string") {
        cmp = av.localeCompare(bv, "ko");
      } else {
        cmp = (av || 0) - (bv || 0);
      }
      // 합계 점수(total) 정렬에서 동점이면 정렬 방향과 무관하게 입지 점수가
      // 높은 쪽이 앞선다 (spec FR-005) — 이 타이브레이크에는 sortState.dir을
      // 곱하지 않고 바로 반환한다.
      if (cmp === 0 && sortState.key === "total") {
        const aLoc = (a.scores && a.scores.location) || 0;
        const bLoc = (b.scores && b.scores.location) || 0;
        return bLoc - aLoc;
      }
      return cmp * sortState.dir;
    });

    rankingBody.innerHTML = sorted.map((site, i) => {
      const g = site._grade;
      return `
        <tr class="comparison-row">
          <td class="rank-cell${i === 0 ? " rank-1" : ""}">${i + 1}</td>
          <td class="name-cell">
            <a href="#${site.id}" data-target="${site.id}"><strong>${site.name}</strong></a>
          </td>
          <td class="district-cell">${site.district}</td>
          <td class="num-cell">${fmtNum(site.area_m2)}</td>
          <td class="num-cell">${site.units}</td>
          <td class="stage-cell">${site.stage}</td>
          <td class="score-cell">${site._total}점</td>
          <td><span class="grade-pill grade-${g.toLowerCase()}${g === "A" ? " gradient-spotlight-card" : ""}">${g}</span></td>
        </tr>
      `;
    }).join("");

    rankingBody.querySelectorAll("a[data-target]").forEach(a => {
      a.addEventListener("click", e => {
        e.preventDefault();
        scrollToId(a.dataset.target);
      });
    });

    rankingHeadRow.querySelectorAll(".sort-btn").forEach(btn => {
      const active = btn.dataset.key === sortState.key;
      btn.classList.toggle("is-sorted", active);
      const indicator = btn.querySelector(".sort-indicator");
      indicator.textContent = active ? (sortState.dir === 1 ? "▲" : "▼") : "";
      const th = btn.closest("th");
      th.setAttribute("aria-sort", active ? (sortState.dir === 1 ? "ascending" : "descending") : "none");
    });
  }

  // ------------------------------------------------------------------
  // GSAP ScrollTrigger — pin + scrub scene transitions, one-shot gauges
  // (Constitution IV, V)
  // ------------------------------------------------------------------

  function setupScrollTriggers() {
    gsap.registerPlugin(ScrollTrigger);

    // 게이지/숫자 카운트업은 폭에 상관없이(모바일 포함) 진입 시 1회만 실행된다.
    sceneEls.forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 75%",
        once: true,
        onEnter: () => activateScene(el, true)
      });
    });

    // Pin + scrub 씬 전환은 데스크톱 폭에서만 만든다 — 모바일은 단순 페이드로 축소
    // (Constitution VIII). ScrollTrigger.matchMedia는 폭이 바뀌면 이 안에서 만든
    // ScrollTrigger/gsap.set을 자동으로 되돌린다.
    ScrollTrigger.matchMedia({
      [DESKTOP_MEDIA]: function () {
        gsap.set(sceneEls.slice(1), { yPercent: 100 });

        sceneEls.forEach((el, i) => {
          const bg = el.querySelector(".scene-bg");
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "+=100%",
              scrub: true,
              pin: true,
              pinSpacing: false
            }
          });
          tl.fromTo(bg, { scale: 1.15 }, { scale: 1, ease: "none" }, 0);
          if (sceneEls[i + 1]) {
            tl.to(sceneEls[i + 1], { yPercent: 0, ease: "none" }, 0);
          }
        });
      }
    });
  }

  function activateScene(el, animate) {
    el.classList.add("is-active");
    const i = Number(el.dataset.index);
    const site = sites[i];
    if (!site) return;

    const totalEl = el.querySelector(".js-total");
    if (totalEl) {
      if (animate) animateNumber(totalEl, site._total, TOTAL_DURATION_MS);
      else totalEl.textContent = site._total;
    }

    el.querySelectorAll(".gauge-row").forEach(row => {
      const target = Number(row.dataset.target) || 0;
      const valueEl = row.querySelector(".js-val");
      const fillLine = row.querySelector(".gauge-fill-line");
      const fillRatio = fillLine ? Number(fillLine.dataset.fillRatio) || 0 : 0;
      const targetOffset = GAUGE_LINE_LENGTH * (1 - fillRatio);

      if (valueEl) {
        if (animate) animateNumber(valueEl, target, TOTAL_DURATION_MS);
        else valueEl.textContent = target;
      }
      if (fillLine) {
        if (animate && window.gsap) {
          gsap.to(fillLine, { strokeDashoffset: targetOffset, duration: GAUGE_DURATION_S, ease: "power2.out" });
        } else {
          fillLine.setAttribute("stroke-dashoffset", targetOffset);
        }
      }
    });
  }

  function activateAllImmediately() {
    sceneEls.forEach(el => activateScene(el, false));
  }

  function animateNumber(el, target, duration) {
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
