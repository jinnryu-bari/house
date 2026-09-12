<!--
Sync Impact Report
==================
Version change: 1.1.0 → 2.0.0 (MAJOR — Principle X redefined, not just clarified)
Modified principles:
  - III. Design Token Fidelity to DESIGN.md — font-substitution detail updated: GT
    Walsheim → Pretendard 700 (display) / Pretendard 400 (body), fallback Inter, loaded
    from the Pretendard project's own CDN distribution (not Google Fonts, which does not
    host it). Korean display letter-spacing is fixed at -3% (-0.03em) across all display
    tiers, overriding DESIGN.md's literal per-tier px values (which assume Latin/GT
    Walsheim compression tolerances that Hangul cannot survive without colliding strokes).
  - VIII. Accessibility & Reduced Motion — "Grade MUST always be shown as a letter... in
    addition to its color" no longer fits: grade is not color-coded at all now (see
    Principle X, redefined). Reworded to require the letter render as real text regardless
    of the surface-lift/gradient treatment around it.
  - X. Grade Differentiation Redefined: Surface Lift + Pill, Not Hue (was: "Grade Color Is
    a Semantic Exception to the One-Accent Rule") — REVERSED. The four-hue grade exception
    (teal/gold/gray/red) is retracted; grade A/B/C/D is now distinguished by surface lift
    (canvas/surface-1/surface-2) and, for grade A only, the one permitted
    gradient-spotlight-card treatment — never by a dedicated hue per grade. This is an
    incompatible redefinition of the prior principle, hence the MAJOR bump.
Added sections: N/A
Removed sections: N/A
Follow-up TODOs: None
-->

# House (새사주 신축매입약정 사업지 스코어보드) Constitution

## Core Principles

### I. Static Single-Page, No Build Step
The site is a single static HTML page. No frontend framework, bundler, transpiler, or
build step (npm build, webpack, vite, etc.) MAY be introduced. Only plain HTML, CSS, and
vanilla JavaScript, plus the one exception named in Principle IV, MAY be used. The result
MUST run by opening/serving the files as-is.
**Rationale**: The project's scope and lifespan do not justify build tooling; every build
step added is a future maintenance and deployment liability with no corresponding benefit.

### II. Single Data Source (data/sites.json)
All business-site content (name, district, area, zoning, unit count, stage, image path,
intro paragraphs, category scores) MUST be read at runtime from `data/sites.json`. HTML
and JS MUST NOT hardcode any site-specific data. Adding, removing, or editing a site MUST
require editing only this JSON file.
**Rationale**: A single source of truth prevents drift between what the page shows and
what the data actually says, and lets non-developers update site data safely.

### III. Design Token Fidelity to DESIGN.md
`DESIGN.md` at the project root is the highest-priority source of truth for all color,
typography, spacing, radius, and component tokens. It was generated via
`npx getdesign@latest add framer` and documents framer.com's own marketing brand system
(dark canvas, GT Walsheim display type, single blue accent, gradient spotlight cards) —
this project deliberately adopts that visual system (see Principle X for the one
documented exception). `css/tokens.css` MUST be generated from `DESIGN.md` and MUST be
the first file produced whenever `DESIGN.md` changes. Every key under `DESIGN.md`'s
front-matter `components:` block (e.g. `top-nav`, `footer`, `pricing-card`,
`feature-row`, `comparison-row`) MUST be used verbatim as a CSS class name wherever this
project implements that component — never renamed, abbreviated, or translated; where no
honest structural equivalent exists on this page (e.g. `faq-row`, `text-input`), it MUST
NOT be force-mapped onto an unrelated element. `DESIGN.md` itself MUST NOT be edited by
implementation work; if the design must evolve, that evolution happens in
`tokens.css`/`style.css`, not by rewriting the reference file. GT Walsheim (the
documented display font) has no Hangul coverage and is not freely redistributable;
`tokens.css` MUST substitute it per DESIGN.md's own "Note on Font Substitutes" section
rather than silently drop the letter-spacing/weight system it specifies. Concretely:
`--font-display`/`--font-body` MUST resolve to `"Pretendard", "Inter", ...system stack`
(Pretendard loaded from its own CDN distribution, not Google Fonts); display weight is
700 (not DESIGN.md's literal 500, which was tuned for GT Walsheim Medium); and every
display tier's letter-spacing is exactly `-0.03em`, not the literal per-tier px values in
DESIGN.md, because Hangul cannot survive Latin-tuned negative tracking without glyphs
colliding.
**Rationale**: A single immutable reference, mapped 1:1 into class names, keeps design
and implementation from silently diverging and makes design review possible by diffing
`tokens.css` against `DESIGN.md` alone.

### IV. GSAP ScrollTrigger Pin + Scrub Is the Sole Scroll Mechanism
The scroll-driven site-to-site transition MUST be implemented with GSAP ScrollTrigger
using `pin` + `scrub`: each site section is pinned for 100vh while, scrubbed to scroll
position, its image scales 1.15 → 1.0 and the next section enters via
`translateY(100%) → 0`. GSAP (with the ScrollTrigger plugin) is the one and only external
script dependency permitted in this project; no other animation, scroll, or UI library
MAY be added alongside or instead of it.
**Rationale**: A single named mechanism, explicitly scoped to one library, prevents the
scroll experience from being reimplemented three different ways across sessions and keeps
the dependency surface auditable.

### V. SVG Gauges, One-Shot on Entry
Score gauges MUST be SVG shapes animated via `stroke-dashoffset`, not CSS `width`/
`transform: scaleX`/canvas. Each gauge's fill animation and its paired number count-up
MUST fire exactly once, triggered by ScrollTrigger's `onEnter` for that section — never
re-triggered on re-entry, and never continuously scrubbed to scroll position.
**Rationale**: A stroke-based gauge is crisp at any size and matches the editorial,
map/score-card visual language; firing once on entry (rather than scrubbing) keeps the
number and the arc reading as a single deliberate reveal instead of jittering with scroll.

### VI. Recomputed Scores, Never Trusted Blindly
`total` and `grade` displayed anywhere on the page MUST be computed client-side as the sum
of `scores` (and the corresponding grade-rule bucket), never read directly from
`data/sites.json`. If the JSON's stored `total`/`grade` disagrees with the recomputed
value, the site name and both values MUST be logged via `console.warn`; the page still
renders the recomputed value.
**Rationale**: Treating the JSON as unverified input catches data-entry mistakes instead
of silently displaying them, while still keeping the page fully functional.

### VII. In-Memory Sort State for the Comparison Table
The comparison table's sort state (active column, direction) MUST live only in a JS
variable for the current page session. It MUST NOT be written to the URL, a cookie,
`localStorage`, or any other persistent store. Clicking a column header re-sorts the
in-memory site list and re-renders `<tbody>`; a page reload always returns to the default
sort (total score, descending).
**Rationale**: This is presentation-only state for a single viewing session; persisting it
adds storage-API surface and edge cases (stale sort key, cross-tab state) with no user
benefit for a small, four-row comparison table.

### VIII. Accessibility & Reduced Motion
Every `<img>` MUST have a descriptive `alt`. Grade MUST always render as an explicit
letter (A/B/C/D) as real text — never conveyed only by which surface-lift level or
gradient a badge happens to use (see Principle X; this system does not color-code grade
at all, so the letter is the entire signal, not a supplement to one). Interactive controls
(nav links, sortable column headers) MUST be real, keyboard-operable elements (`<a>`,
`<button>`), not `<div>`/`<span>` with click handlers. When the user has
`prefers-reduced-motion: reduce` set, ScrollTrigger pinning/scrubbing, the Ken Burns image
scale, and the gauge fill animation MUST all be disabled; the final state MUST render
immediately instead.
**Rationale**: Accessibility is a baseline requirement, not an enhancement, and motion
preference is an explicit signal that overrides any scroll-story ambition.

### IX. Relative Paths & GitHub Pages Root Deployment
All HTML/CSS/JS references to other project files (stylesheets, scripts, `data/sites.json`,
`assets/*`) MUST use relative paths, never a path beginning with `/`. The `main` branch's
repository root is the designated GitHub Pages source; a `.nojekyll` file MUST exist at
the repository root so GitHub Pages serves the site as static files without Jekyll
processing (which would otherwise ignore folders/files it treats as special, e.g. those
starting with `_`).
**Rationale**: GitHub Pages serving from the root with Jekyll processing on is the most
common cause of "works locally, breaks once deployed" for static sites; relative paths and
`.nojekyll` remove both failure modes up front.

### X. Grade Differentiation Is Surface Lift + Pill, Not Hue
`DESIGN.md` reserves exactly one chromatic accent (`accent-blue`) and explicitly instructs
"don't combine more than one chromatic accent" and "don't apply gradient backgrounds to
whole sections — gradients are cards." Grade A/B/C/D MUST NOT be distinguished by a
dedicated hue per grade. Instead: grade D uses `canvas` (flat, no lift), grade C uses
`surface-1`, grade B uses `surface-2`, and grade A alone uses the one permitted
`gradient-spotlight-card` treatment (`gradient-violet` → `gradient-magenta`) — applied
only to that grade's own badge/chip/pill elements, never to a full-bleed section. Every
grade indicator MUST also be shaped as a pill (`--rounded-pill`/`--rounded-full`) per
DESIGN.md's own component name. No element anywhere in the system MAY introduce a hue
outside `{accent-blue, the four DESIGN.md gradient stops used only for grade A}`; anywhere
color previously stood in for a UI/interaction signal (link hover, sorted-column
indicator, top row of a sort) MUST use `accent-blue`, and anywhere it stood in for a
site-specific decorative accent (per-scene badge tint, gauge fill, ambient section
backdrop) MUST become neutral (`ink`/`ink-muted`/a surface token) instead.
**Rationale**: A second de-facto accent family (four grade hues used everywhere a site's
color needed to show up) is exactly the drift DESIGN.md's one-accent rule exists to
prevent; encoding grade as depth + shape + the explicit letter keeps the signal legible
without reintroducing color as a second brand accent.

## Additional Constraints

- File structure is fixed: `index.html`, `css/tokens.css` (tokens only, generated from
  `DESIGN.md`), `css/style.css` (component/layout rules built on top of the tokens),
  `js/main.js`, `data/sites.json`, `assets/`. New top-level files/folders beyond these
  (plus this `.specify/` governance folder and `DESIGN.md`) require a documented reason.
- `css/tokens.css` MUST contain only custom-property declarations (and, where the
  mapping table names a component, the class selector's token assignments) — it MUST NOT
  contain component layout rules; those belong in `css/style.css`.

## Governance

This constitution supersedes all other project practices and prior undocumented
conventions established in earlier sessions. Any amendment MUST be recorded in this file
with an updated Sync Impact Report, a version bump following semantic versioning (MAJOR
for incompatible principle removals/redefinitions, MINOR for new or materially expanded
principles, PATCH for clarifications and wording fixes), and an updated Last Amended date.

All feature work MUST be checked against these principles before being considered
complete. Any deviation MUST be justified in the relevant planning artifact or rejected.
Complexity or dependencies not required by these principles MUST be avoided in favor of
the simplest solution that satisfies them.

**Version**: 2.0.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-12
