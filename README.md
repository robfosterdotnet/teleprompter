# Teleprompter (web)

Modern web-based teleprompter for webcast rehearsals and live delivery. The initial scaffold delivers a responsive placeholder layout so we can wire up state, controls, and persistence in upcoming tasks.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed localhost URL to view the placeholder teleprompter shell. The dev server supports hot reloading via Vite.

## Available Scripts

| Command             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the Vite development server.                    |
| `npm run build`     | Type-check (`tsc -b`) and create a production bundle. |
| `npm run preview`   | Serve the production build locally.                   |
| `npm run lint`      | Run ESLint with type-aware + Tailwind rules.          |
| `npm run test`      | Run Vitest (uses jsdom + Testing Library).            |
| `npm run format`    | Format files via Prettier.                            |
| `npm run typecheck` | Standalone TypeScript project references build.       |

## Project Structure

- `src/` — React application code. `App.tsx` renders the reading pane and presenter controls preview; styles live in co-located CSS for now.
- `public/` — Static assets (favicons, manifest) served as-is.
- `plans/` — Planning docs (`teleprompter-plan.md`, `progress-tracker.md`) that outline upcoming milestones.
- `.github/workflows/ci.yml` — CI pipeline that installs deps, lints, tests, and builds.

## Tooling & Conventions

- ESLint runs with TypeScript-aware rules, React hooks guidance, Tailwind linting, and Prettier compatibility.
- Tailwind CSS is configured (with custom tokens) even though the UI currently leans on handcrafted CSS.
- Prettier + lint-staged run automatically via Husky on each commit; CI mirrors the same checks.
- VS Code settings/extensions are checked in to keep formatting consistent across contributors.

## Testing

Vitest + Testing Library power unit/UI tests (`npm run test`). Run `npm run test -- --run` for a single pass (used by Husky + CI). A starter test verifies the placeholder teleprompter renders as expected; expand coverage as new components land.

## Next Milestones

Follow `plans/progress-tracker.md` for the detailed roadmap. With Task 2 (tooling and quality gates) complete, Task 3 (state management foundation) is up next.
