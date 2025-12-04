# Teleprompter (web)

Modern web-based teleprompter for webcast rehearsals and live delivery. The initial scaffold delivers a responsive placeholder layout so we can wire up state, controls, and persistence in upcoming tasks.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed localhost URL to view the placeholder teleprompter shell. The dev server supports hot reloading via Vite.

## Available Scripts

| Command                 | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Start the Vite development server.                                |
| `npm run build`         | Type-check (`tsc -b`) and create a production bundle.             |
| `npm run preview`       | Serve the production build locally.                               |
| `npm run lint`          | Run ESLint with type-aware + Tailwind rules.                      |
| `npm run test`          | Start Vitest in watch mode (jsdom + Testing Library).             |
| `npm run test:run`      | Single Vitest run (used by Husky + CI).                           |
| `npm run test:coverage` | Generate an Istanbul coverage report (threshold ≥80% statements). |
| `npm run test:e2e`      | Run Playwright keyboard/theme/e2e flows with axe checks.          |
| `npm run test:e2e:ui`   | Launch the Playwright UI runner for debugging.                    |
| `npm run format`        | Format files via Prettier.                                        |
| `npm run typecheck`     | Standalone TypeScript project references build.                   |

## Project Structure

- `src/` — React application code. `App.tsx` renders the reading pane and presenter controls preview; styles live in co-located CSS for now.
- `public/` — Static assets (favicons, manifest) served as-is.
- `plans/` — Planning docs (`teleprompter-plan.md`, `progress-tracker.md`, `decision-log.md`) that outline direction and context.
- `docs/` — Deployment guide, accessibility reports, release log, and knowledge-transfer notes (`docs/deployment.md`, `docs/releases.md`, etc.).
- `.github/workflows/ci.yml` — CI pipeline that installs deps, lints, tests, builds, and now triggers Netlify deploys on `main`.
- `netlify.toml` — Production build configuration (dist publish directory + SPA redirect).

## Tooling & Conventions

- ESLint runs with TypeScript-aware rules, React hooks guidance, Tailwind linting, and Prettier compatibility.
- Tailwind CSS is configured (with custom tokens) even though the UI currently leans on handcrafted CSS.
- Prettier + lint-staged run automatically via Husky on each commit; CI mirrors the same checks.
- VS Code settings/extensions are checked in to keep formatting consistent across contributors.

## Testing

- **Unit/UI:** `npm run test` (watch) or `npm run test:run` (single pass) executes Vitest with Testing Library + jsdom. Hooks/components rely on a shared store reset helper so cases stay isolated.
- **Coverage:** `npm run test:coverage` enables Istanbul output (`coverage/` directory) and enforces ≥80% statements overall—check `coverage/summary.json` for CI uploads.
- **End-to-end:** `npm run test:e2e` boots the Vite dev server automatically and drives keyboard/theme flows via Playwright across Chromium/Firefox/WebKit. Run `npx playwright install --with-deps` once per machine to download the browsers; use `npm run test:e2e:ui` for the interactive runner.
- **Accessibility:** Playwright specs use `@axe-core/playwright`, and `src/App.a11y.test.tsx` runs `vitest-axe` to guard against regressions in both unit and browser layers.
- **CI notes:** `.github/workflows/ci.yml` runs linting, the Vitest single pass, coverage upload, and the full Playwright suite on every push/PR to `main`.

## Script Management & Persistence

- All playback settings, presenter preferences, and the active script are autosaved to `localStorage` (Zustand persist + a `teleprompter-script-draft` backup) so you can refresh mid-rehearsal without losing edits.
- Import Markdown or JSON scripts from the presenter panel (buttons in the Script Manager section). The parser expects a `# Title` followed by `## Segment` headings; see [`examples/sample-show.md`](examples/sample-show.md) for a template.
- Export the current script as Markdown or JSON—downloads use the script title as the filename.
- The import/export utilities normalize IDs and timestamps so downstream features (segment navigation, timers, persistence) keep working even with external content.

## Project Status

- **Bootstrap & Tooling (Tasks 1–2):** Completed — Vite scaffold + lint/test/CI stack.
- **State & Presenter Shell (Tasks 3–5):** Completed — Zustand store with playback prefs, teleprompter view, presenter controls (timers, navigator, notes).
- **Theming & Accessibility (Task 6):** Completed — Dark/light/high-contrast themes, mirror toggles, axe-backed WCAG checks.
- **Persistence & Import/Export (Task 7):** Completed — Autosave, Markdown/JSON import/export, example rundowns.
- **Testing & Hardening (Task 8):** Completed — Vitest + RTL coverage ≥80% plus Playwright regression flows.
- **Deployment Pipeline (Task 9):** Completed — Netlify production target deployed automatically from `main` via GitHub Actions.
- **Documentation Pass (Task 10):** Completed — README/AGENTS refreshed, deployment + release guides published, changelog initiated.

## Deployment

- **Production target:** Netlify (SPA, Vite build). Configure `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` as GitHub Action secrets; `netlify.toml` handles the build command and SPA redirect.
- **Pipeline:** `.github/workflows/ci.yml` runs lint/tests/build, then a `deploy` job (only on `main` pushes) rebuilds and runs `netlify deploy --prod`. CI must stay green before deploy runs.
- **Manual deploys:** With local credentials, run `npm run build` followed by `npx netlify deploy --dir=dist --prod`. See `docs/deployment.md` for troubleshooting, including how to test via `netlify deploy --dir=dist --alias=preview`.
- **Verification:** Use `npm run preview` for a local smoke test before pushing. After CI deploys, check the Netlify dashboard + production URL and log the timestamp in `docs/releases.md`.

## Docs & Assets

- `docs/deployment.md` — How CI + Netlify interact, required secrets, rollback steps.
- `docs/releases.md` — Running release notes (also summarized in `CHANGELOG.md`).
- `docs/knowledge-transfer.md` — Architecture overview, extension checklist, and onboarding tasks.
- `docs/media/` — Screenshots/gifs for README and release notes. Capture fresh shots via `npx playwright screenshot <url> docs/media/presenter-view.png` from a non-sandboxed environment; some sandboxed CI shells (like Codex) block Chrome’s crash reporter, so grab assets locally if that error appears.
- `CHANGELOG.md` — Keep-a-changelog format that mirrors release milestones.

See `plans/progress-tracker.md` for the full breakdown and `plans/decision-log.md` for context behind key choices.
