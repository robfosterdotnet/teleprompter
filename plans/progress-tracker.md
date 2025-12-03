# Development Progress Plan

This plan precedes implementation work and tracks every major deliverable for the web-only teleprompter. Update the status and results columns as tasks evolve.

| #   | Task                        | Details                                                                                                                                                     | Expected Result                                                                             | Status      |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| 1   | Repository bootstrap        | Initialize React + TypeScript app via Vite, configure npm scripts, and commit the clean scaffold.                                                           | Running dev server (`npm run dev`) with placeholder layout and lint/test scripts available. | Completed   |
| 2   | Tooling & quality gates     | Add ESLint, Prettier, stylelint/Tailwind config, TypeScript strict mode, Husky/pre-commit hooks, and CI workflow to run lint/test on push.                  | Automated lint/test pipeline that blocks non-compliant commits and PRs.                     | Completed   |
| 3   | State management foundation | Introduce Zustand (or Redux Toolkit) store to manage script content, playback speed, and UI preferences with typed selectors.                               | Shared state layer with initial actions/selectors plus persistence scaffolding.             | Not Started |
| 4   | Core teleprompter view      | Build the main reading pane with adjustable font size, line spacing, and responsive layout; implement keyboard shortcuts for scroll speed and pause/resume. | Smooth autoscroll experience verified in-browser with accessible controls.                  | Not Started |
| 5   | Presenter controls panel    | Implement dual-pane layout showing presenter controls (segment list, timers, notes) beside the audience-facing script. Enable segment jump navigation.      | Synchronized presenter panel that updates active segment and exposes timing widgets.        | Not Started |
| 6   | Theming & accessibility     | Provide high-contrast/light/dark themes, dyslexic-friendly font toggle, mirroring options, and adherence to WCAG color ratios.                              | Theme switcher and mirrored output verified via Storybook or manual QA notes.               | Not Started |
| 7   | Persistence & import/export | Autosave scripts/settings to localStorage, support Markdown import, and allow exporting the current script as `.md` or `.json`.                             | Reliable persistence plus manual import/export commands documented in README.               | Not Started |
| 8   | Testing suite               | Write Vitest + RTL unit tests for hooks/components, add Playwright specs for keyboard controls and dual-display layout, and document coverage expectations. | ≥80% coverage report and passing Playwright suite recorded in CI logs.                      | Not Started |
| 9   | Deployment pipeline         | Configure production build, preview server, and deployment target (Vercel/Netlify). Automate deployments from `main` after CI success.                      | Accessible production URL with versioned releases and README deployment instructions.       | Not Started |
| 10  | Documentation pass          | Update README, `AGENTS.md`, and `plans/teleprompter-plan.md` with setup steps, feature status, and future work.                                             | Current documentation reflecting implemented features and known gaps.                       | Not Started |

## Task Breakdown

### 1. Repository Bootstrap

- **1.1 Choose tooling** — Decide between Vite and Next.js, confirm npm vs pnpm, and document rationale. _Result:_ Selected Vite + React + TypeScript with npm (web-only focus). _Status:_ Completed.
- **1.2 Scaffold project** — Run `npm create vite@latest` (React + TS), remove boilerplate, and verify `npm run dev`. _Result:_ Vite React-TS scaffold copied into repo, dependencies installed, and dev server verified locally. _Status:_ Completed.
- **1.3 Configure paths & aliases** — Add `tsconfig.json` paths (e.g., `@/components`) and mirror them in Vite config. _Result:_ `@/*` alias resolves to `src/*` in both TS and Vite builds. _Status:_ Completed.
- **1.4 Initial commit** — Stage scaffold, ensure `.gitignore` covers `node_modules` and `.env*`, and create `feat: bootstrap app` commit. _Result:_ Baseline revision (`feat: bootstrap web teleprompter`). _Status:_ Completed.

### 2. Tooling & Quality Gates

- **2.1 ESLint/Prettier setup** — Install dependencies, add configs, integrate Tailwind plugin, and align with repo style (2 spaces, single quotes). _Result:_ Flat ESLint config w/ type-aware rules + Prettier config (see `eslint.config.js`, `prettier.config.cjs`). _Status:_ Completed.
- **2.2 Stylelint or tailwind config** — Configure Tailwind `tailwind.config.ts` and optional stylelint rules for custom CSS. _Result:_ Tailwind + PostCSS initialized with custom tokens and global CSS wired. _Status:_ Completed.
- **2.3 TypeScript strictness** — Enable `strict`, `noImplicitAny`, `strictNullChecks`, etc., and fix resulting errors. _Result:_ Existing strict settings enforced via `tsconfig.*`; lint + typecheck clean. _Status:_ Completed.
- **2.4 Husky hooks** — Add pre-commit hook running lint + tests (or lint-staged). _Result:_ `.husky/pre-commit` runs lint-staged + `npm run test -- --run` before commit. _Status:_ Completed.
- **2.5 CI workflow** — Create GitHub Actions workflow that installs deps, lints, tests, and uploads coverage artifact. _Result:_ `.github/workflows/ci.yml` mirrors local scripts. _Status:_ Completed.
- **2.6 Editor settings** — Publish `.editorconfig` and VS Code recommendations to keep indentation/formatting consistent. _Result:_ `.editorconfig` + `.vscode/` files checked in. _Status:_ Completed.

### 3. State Management Foundation

- **3.1 Decide store library** — Compare Zustand vs Redux Toolkit, document choice and reasons. _Result:_ Decision logged in plan. _Status:_ Not Started.
- **3.2 Define domain models** — Create TypeScript interfaces for `Script`, `Segment`, `Preferences`, etc. _Result:_ Types exported from `src/types`. _Status:_ Not Started.
- **3.3 Implement store slices** — Set up store file with actions for loading scripts, adjusting speed, toggling themes. _Result:_ Store accessible through hooks. _Status:_ Not Started.
- **3.4 Persistence + tests** — Add middleware to hydrate from localStorage, persist changes, and cover reducers with Vitest specs. _Result:_ State survives refresh and is regression-tested. _Status:_ Not Started.

### 4. Core Teleprompter View

- **4.1 Layout skeleton** — Build responsive layout with reading pane centered. _Result:_ Base UI matches wireframe. _Status:_ Not Started.
- **4.2 Autoscroll engine** — Implement `requestAnimationFrame` loop with acceleration controls. _Result:_ Smooth scrolling validated manually. _Status:_ Not Started.
- **4.3 Keyboard shortcuts** — Map keys (`Space`, `J/K`, arrow keys) using custom hook; ensure focus management. _Result:_ Shortcuts documented and working. _Status:_ Not Started.
- **4.4 Typography controls** — Add sliders for font size/line spacing and link them to state. _Result:_ Controls update preview in real time. _Status:_ Not Started.
- **4.5 Content highlighting** — Highlight current segment or line to aid eye tracking. _Result:_ Clear visual cue in reader view. _Status:_ Not Started.
- **4.6 Accessibility audit** — Run Lighthouse/axe to ensure reading pane meets ARIA expectations. _Result:_ Report saved in `/docs` or noted in PR. _Status:_ Not Started.

### 5. Presenter Controls Panel

- **5.1 Split-view layout** — Introduce CSS grid/flex layout for presenter vs audience panes. _Result:_ Dual view responsive down to tablet widths. _Status:_ Not Started.
- **5.2 Segment navigator** — Render segment list with active highlighting and jump buttons. _Result:_ Jump updates scroll position accurately. _Status:_ Not Started.
- **5.3 Timer widgets** — Build countdown/elapsed/ETA timers tied to scroll speed. _Result:_ Timers remain within ±1s accuracy. _Status:_ Not Started.
- **5.4 Notes lane** — Provide per-segment notes input stored alongside script data. _Result:_ Notes persist and display only in presenter pane. _Status:_ Not Started.

### 6. Theming & Accessibility

- **6.1 Theme config** — Define theme tokens (colors, fonts) in Tailwind config. _Result:_ `ThemeProvider` or CSS vars manage modes. _Status:_ Not Started.
- **6.2 Theme switcher UI** — Add toggle component for light/dark/high-contrast/dyslexic fonts. _Result:_ Visual change occurs instantly. _Status:_ Not Started.
- **6.3 Mirroring controls** — Allow horizontal/vertical flip via CSS transforms for stage monitors. _Result:_ Mirror mode toggle verified. _Status:_ Not Started.
- **6.4 WCAG validation** — Use tooling (axe DevTools) to confirm contrast ratios ≥ 4.5:1. _Result:_ Checklist in PR/plan. _Status:_ Not Started.

### 7. Persistence & Import/Export

- **7.1 LocalStorage helpers** — Write utility for safe read/write with versioning. _Result:_ Data migrations possible later. _Status:_ Not Started.
- **7.2 Autosave loop** — Debounce script edits and persist automatically. _Result:_ Edits survive refreshes without manual save. _Status:_ Not Started.
- **7.3 Markdown import** — Parse `.md` (front matter for metadata) and map to segments. _Result:_ Import modal handles happy/error paths. _Status:_ Not Started.
- **7.4 Export formats** — Provide `.md` and `.json` download options. _Result:_ Files contain full script + metadata. _Status:_ Not Started.
- **7.5 Sample templates** — Add `/examples` with demo scripts for testing. _Result:_ Users can trial features instantly. _Status:_ Not Started.
- **7.6 README instructions** — Document how to use import/export, including sample files. _Result:_ Section added to README. _Status:_ Not Started.

### 8. Testing Suite

- **8.1 Unit test scaffolding** — Configure Vitest + RTL setup files (jsdom, matchers). _Result:_ `npm run test` runs zero-test baseline. _Status:_ Not Started.
- **8.2 Component tests** — Cover teleprompter view, controls, and theming toggles. _Result:_ Key UI behaviors locked down. _Status:_ Not Started.
- **8.3 Store tests** — Validate state transitions and persistence hooks. _Result:_ Regression protection for business logic. _Status:_ Not Started.
- **8.4 Playwright setup** — Add E2E config, fixtures, and scripts. _Result:_ `npm run test:e2e` automates keyboard flows. _Status:_ Not Started.
- **8.5 Accessibility regression tests** — Add axe checks within Playwright to prevent contrast regressions. _Result:_ Automated accessibility guardrails. _Status:_ Not Started.
- **8.6 Coverage reporting** — Enable `vitest --coverage` and upload artifact in CI. _Result:_ Coverage badge/stats available. _Status:_ Not Started.

### 9. Deployment Pipeline

- **9.1 Build verification** — Ensure `npm run build` outputs optimized assets and preview works offline. _Result:_ Production build reproducible. _Status:_ Not Started.
- **9.2 Hosting setup** — Configure Vercel/Netlify project, environment vars, and custom domain if needed. _Result:_ Deployment target reachable. _Status:_ Not Started.
- **9.3 CI deploy step** — Add `deploy` job triggered on `main` success with cache for faster builds. _Result:_ Automatic deploy after merge. _Status:_ Not Started.
- **9.4 Release notes** — Draft template for tagging releases and summarizing changes. _Result:_ `/docs/releases.md` or GitHub Releases configured. _Status:_ Not Started.

### 10. Documentation Pass

- **10.1 README refresh** — Add setup instructions, architecture overview, and screenshots/gifs. _Result:_ New contributors onboard quickly. _Status:_ Not Started.
- **10.2 AGENTS.md sync** — Update contributor guidelines with completed tools/tests. _Result:_ Accurate process guidance. _Status:_ Not Started.
- **10.3 Screenshot/video capture** — Produce assets for README + release notes. _Result:_ Visual proof of features. _Status:_ Not Started.
- **10.4 Plan updates** — Reflect finished tasks and lessons in `plans/teleprompter-plan.md` + this tracker. _Result:_ Living roadmap maintained. _Status:_ Not Started.
- **10.5 Changelog** — Start `CHANGELOG.md` following Keep a Changelog + SemVer. _Result:_ Version history visible. _Status:_ Not Started.
- **10.6 Knowledge transfer** — Record loom/video or internal doc summarizing architecture decisions. _Result:_ New devs ramp faster. _Status:_ Not Started.
