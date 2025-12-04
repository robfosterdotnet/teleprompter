# Repository Guidelines

This repo powers the Teleprompter + AI Script Builder web app (Vite + React + TypeScript). Core domains live under `src/views/teleprompter` and `src/views/scriptBuilder`, with shared hooks, stores, and utilities coordinating uploads, Azure OpenAI streaming, and presenter controls.

## Project Structure & Module Organization

Keep application code inside `src/`, grouped by feature (e.g., `src/scroll`, `src/views`, `src/store`). Shared UI primitives belong in `src/components/common`, and hooks in `src/hooks`. Static assets (fonts, icons, manifest) live in `public/`. Long-form planning notes stay in `plans/teleprompter-plan.md`; update it whenever scope changes. Tests sit next to the code they cover (`Component.test.tsx`) or under `tests/` for broader flows. Configuration such as Vite, ESLint, and Tailwind files remain at the repo root for easy visibility.

## Build, Test, and Development Commands

- `npm install` — install or refresh dependencies.
- `npm run dev` — start the Vite dev server with hot reload; ideal for iterating on the web-only teleprompter UI.
- `npm run build` — produce the production bundle (checks type errors).
- `npm run preview` — serve the built assets locally to verify before deployment.
- `npm run lint` — run ESLint + Prettier checks.
- `npm run test` — execute unit/UI tests via Vitest and React Testing Library.
- `npm run test:e2e` — run the Playwright suite (requires `npx playwright install --with-deps` once per machine).
- `npx netlify deploy --dir=dist --alias=preview` — optional manual preview deployment (see `docs/deployment.md`).

## Coding Style & Naming Conventions

Use TypeScript everywhere. Prefer functional React components with hooks; no class components. Components and files are PascalCase (`SegmentPanel.tsx`), hooks use `useCamelCase`, Zustand/Redux slices use `*.slice.ts`. Stick to 2-space indentation, single quotes, and ESLint’s recommended + React hooks rules. Format via Prettier (respect `.prettierrc`), and keep CSS in Tailwind utility classes or co-located module files when utility classes get verbose. Document complex hooks or controllers with short JSDoc comments.

## Testing Guidelines

Write unit tests with Vitest/RTL for every interactive control (speed buttons, theme toggles, dual-view). Name files `*.test.ts` or `*.test.tsx`. For scenario coverage (keyboard flows, timing widgets), add Playwright specs under `tests/e2e/`. Aim for ≥80% statement coverage (`npm run test -- --coverage`) before merging, and mock timing/animation loops so tests stay deterministic.

## Commit & Pull Request Guidelines

Use Conventional Commits (`feat:`, `fix:`, `chore:`) so changelog generation stays easy. Each commit should focus on one logical change (e.g., “feat: add dual-display layout”). PRs must include: concise description, screenshots or short clips for UI changes, linked issue/ticket, test plan (commands + results), and a checklist confirming lint/tests pass. Request review from at least one other contributor before merging to `main`.

## Security & Configuration Tips

Store secrets or webcast-specific tokens in `.env.local` (ignored by git); reference them via `import.meta.env`. Never commit actual scripts meant for proprietary shows—use sanitized samples in `examples/`. When enabling speech APIs or browser features, gate them behind user permission prompts and document fallbacks in the README.

## Deployment Notes

- Netlify hosts production; build settings live in `netlify.toml`.
- GitHub Actions (`.github/workflows/ci.yml`) runs lint/test/build and then deploys to Netlify on `main` pushes. Configure `NETLIFY_SITE_ID` + `NETLIFY_AUTH_TOKEN` secrets.
- Document every deploy in `docs/releases.md` and summarize in `CHANGELOG.md`.

## Operational Notes

- The working copy may enforce sandboxing on git metadata. Elevate permissions (obtain approval/escalation) before running any command that writes outside the workspace defaults—most notably `git add`, `git commit`, or other git operations that touch `.git/`.
