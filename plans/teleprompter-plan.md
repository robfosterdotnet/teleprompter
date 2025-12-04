# Webcast Teleprompter Plan

## Goals

- Deliver a reliable teleprompter for live webcasts that runs smoothly on a laptop and optionally a second display.
- Keep controls intuitive so presenters can adjust pace, layout, and sections mid-show without leaving the main screen.
- Allow quick script prep via imports and autosave for peace of mind during production.

## Feature Set

- **Adjustable Autoscroll:** Keyboard shortcuts for speed up/down, quick pause/resume, and optional Web Speech API pause on voice detection.
- **Dual-Display Layouts:** Presenter view with controls plus mirrored clean output for a confidence monitor; include horizontal/vertical flip toggles.
- **Script Segments:** Break scripts into scenes, jump instantly, highlight active chunk, and show private notes alongside.
- **Styling Presets:** Font size slider, line spacing, high-contrast themes, dyslexic-friendly font toggle, and per-segment emphasis cues.
- **Timing Tools:** Countdown to go-live, elapsed time, and ETA based on current speed; warn when off-target.
- **Content Sync:** Import/export Markdown or Google Docs, autosave to localStorage, optional cloud sync later.

## Tech Stack

- **Frontend:** React + TypeScript scaffolded with Vite (web-only PWA); Tailwind CSS (or CSS Modules) for fast theme iteration.
- **State & Persistence:** Zustand for deterministic playback controls with lightweight middleware; persist scripts via localStorage/IndexedDB.
- **Scrolling Engine:** requestAnimationFrame-driven loop with easing controls; consider `react-window` if scripts become large.
- **Desktop Option:** Ship as PWA first; wrap with Tauri/Electron if native menus or global shortcuts become essential.
- **Tooling:** ESLint + Prettier, Vitest + React Testing Library for unit/UI coverage, and Playwright for keyboard/dual-screen automations.
- **CI/CD:** GitHub Actions pipeline to lint, test, and deploy to Netlify via `netlify/actions/cli` (secrets: `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`).

## Accessibility Validation

- `vitest-axe` runs inside Vitest (`src/App.a11y.test.tsx`) to enforce WCAG rules—including color contrast—across the primary teleprompter view during CI.
- When running `npx @axe-core/cli` inside the Codex sandbox, bind Vite to `127.0.0.1` (e.g., `npm run dev -- --host 127.0.0.1 --port 4173`) to avoid `listen EPERM 0.0.0.0`. Then execute `npx @axe-core/cli http://127.0.0.1:4173 --exit` and capture the report for history.
- Latest audit (axe-core 4.11.0, Chrome headless) ran on **2025-12-04** against `http://127.0.0.1:4173` and found **0 violations**. See `docs/accessibility/axe-2025-12-04.md` for the artifact.

## Testing Coverage

- `npm run test` / `npm run test:run`: Vitest + Testing Library suite covering the teleprompter shell, presenter controls, hooks, and Zustand store (store reset helper avoids cross-test pollution).
- `npm run test:coverage`: Enables Istanbul instrumentation and enforces ≥80% statements overall. Coverage artifacts land in `coverage/`.
- `npm run test:e2e`: Playwright drives the keyboard flow + theme toggles across Chromium/Firefox/WebKit and runs `@axe-core/playwright` over `<main>`. Requires `npx playwright install --with-deps` once per machine.

## Next Steps

1. Confirm target platform (web-only vs desktop wrapper) and finalize MVP scope.
2. Scaffold React project, define script/segment data models, and implement scroll controller prototype.
3. Add theming + dual-view layouts, then integrate persistence and import/export flows.
4. Automate testing in CI and gather feedback from a dry-run webcast.
5. Log each Netlify deploy in `docs/releases.md` + `CHANGELOG.md`, and keep docs updated as new features land.
