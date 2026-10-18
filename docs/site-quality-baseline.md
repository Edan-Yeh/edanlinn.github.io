# Site quality baseline (2026-10-18)

## Scope and safety
- Production: https://edan-yeh.github.io/edanlinn.github.io/
- Current architecture: static GitHub Pages, client-side learning records and game logic.
- This phase is **read-only quality assurance**. Do not delete or overwrite browser localStorage, existing quiz results, completed days, or character state.
- CI gate: `node verify-site.cjs` plus the existing isolated logic/game verification scripts.
- Do not claim browser rendering, accessibility, security, or performance are verified solely because Node.js tests pass.

## Confirmed structural debt
- The page loads 20 CSS files. Many selectors and declarations overlap across base, world, academy, reset, polish and late-stage fixes.
- Most repeated targets include `body`, `.sidebar`, `.hero`, `.rank-card`, and other shared containers.
- A safe refactor needs a before/after browser screenshot baseline. No mass deletion or stylesheet merging until then.

## Automated CSS overlap findings (2026-10-18)
- Exact selector/property declarations found across multiple files: **854** (heuristic, not 854 confirmed visible bugs).
- Highest-risk repeated targets: `body` background/color, `.hero` background/padding, `.sidebar` background, `.rank-card` background, `.hero-main` grid/gap, and `.quiz-option .letter` color.
- This scanner does not resolve specificity, media queries, CSS layers or runtime states; use it to prioritize visual checks, not to delete declarations automatically.
- Quality gates passed all five suites in [GitHub Actions run 39142504964](https://github.com/Edan-Yeh/edanlinn.github.io/actions/runs/39142504964).

## Visual regression matrix
Capture full-page and component screenshots at widths:
- Mobile: 390 × 844 and 430 × 932
- Tablet: 768 × 1024 and 1024 × 768
- Desktop: 1440 × 900 and 1920 × 1080

Validate:
1. Start Here and dashboard alignment, readable sidebar and theme switcher.
2. Portfolio and AI design notes spacing, typography and no clipped cards.
3. Learning path, progress graph, achievements, streak/weapon library.
4. Challenge answers, feedback, form controls and keyboard focus.
5. MOBA scoreboard, hero HP/energy immediately below scoreboard, battle viewport and controls.
6. Daily history, archived lesson reader and mobile scrolling.
7. No unexpected horizontal overflow, overlap, inaccessible focus or pale-on-pale text.

## Accessibility and performance targets
- Normal text contrast ≥ 4.5:1; large text ≥ 3:1.
- Interactive elements visibly focusable, buttons at least 44 × 44 CSS px where practical.
- Avoid animation when `prefers-reduced-motion: reduce` is active.
- Evaluate real Lighthouse/Web Vitals before setting performance claims or changing image assets.
- Preserve light/dark palette behavior without reintroducing overlapping overrides.

## Privacy and data safety
- Browser-local quiz data is not automatically synchronized across devices.
- Public leaderboards and profiles must use explicit consent for age, country and visibility, and server-side authorization before launch.
- Never expose private profile details, access tokens or privileged API keys in static frontend files.
- Plan export/import migration and backup before adding login/sync.

## Change policy
1. Baseline screenshots and existing score/data snapshot.
2. Small changes to one component family.
3. CI logic checks plus visual review at six widths.
4. Verify deployment and rollback by reverting the specific commit if needed.
