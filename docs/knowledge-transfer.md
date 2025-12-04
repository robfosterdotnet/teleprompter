# Knowledge Transfer Notes

## Architecture Snapshot

- **UI stack:** React + TypeScript + Vite. Hooks manage input, while Zustand (`src/store/teleprompterStore.ts`) centralizes script content, preferences, and autosave.
- **Scrolling:** `src/scroll/useAutoscroll.ts` (see code) drives RAF loops; keyboard shortcuts live under `src/hooks/usePrompterShortcuts.ts`.
- **Presenter shell:** `src/views/PresenterView/` houses dual-pane layout, timers, notes, and script manager.
- **Styling:** Tailwind utilities + CSS variables for themes; `ThemeProvider` toggles dark/light/high-contrast/dyslexic modes.
- **Persistence:** Zustand persist middleware + `localStorage` backup. Import/export utilities convert Markdown <-> internal schema.

## Working Agreements

- Tests live next to components (`*.test.tsx`) or under `tests/e2e/`.
- Coverage must stay ≥80% (CI gate). Playwright runs across Chromium/Firefox/WebKit; add `test.describe.configure({ retries: 2 })` for flaky flows.
- Update `plans/teleprompter-plan.md` + `plans/progress-tracker.md` when scope shifts.
- Document externally facing behavior in README + CHANGELOG before shipping.

## Onboarding Checklist

1. `npm install`, `npm run dev`.
2. `npm run test`, `npm run test:e2e` (requires `npx playwright install --with-deps`).
3. `npm run build && npm run preview` to validate production bundle.
4. Review `docs/deployment.md` and ensure GitHub secrets are configured.

## Extending the Teleprompter

- **New controls/features:** Build hooks in `src/hooks/`, UI under `src/views/` or `src/components/common/`. Add store actions/selectors and tests.
- **Persistence changes:** Update `src/utils/storage.ts` version + migration, and note the change in CHANGELOG.
- **Accessibility:** Run `npm run test` (vitest-axe) and `npm run test:e2e` (axe) after UI tweaks. Capture issues in `docs/accessibility/`.

## Future Ideas

- Speech-driven pause/resume (Web Speech API) — gate behind permissions.
- Cloud script sync (Supabase or Firestore) — ensure secrets live in `.env.local`.
- Presenter remote control (WebSockets or WebRTC) — needs authentication plan.

Keep this file up to date after major architectural changes or when onboarding new contributors.
