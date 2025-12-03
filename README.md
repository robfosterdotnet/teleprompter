# Teleprompter (web)

Modern web-based teleprompter for webcast rehearsals and live delivery. The initial scaffold delivers a responsive placeholder layout so we can wire up state, controls, and persistence in upcoming tasks.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed localhost URL to view the placeholder teleprompter shell. The dev server supports hot reloading via Vite.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check (`tsc -b`) and create a production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint over the entire project. |

## Project Structure

- `src/` — React application code. `App.tsx` renders the reading pane and presenter controls preview; styles live in co-located CSS for now.
- `public/` — Static assets (favicons, manifest) served as-is.
- `plans/` — Planning docs (`teleprompter-plan.md`, `progress-tracker.md`) that outline upcoming milestones.

## Next Milestones

Follow `plans/progress-tracker.md` for the detailed roadmap. Task 2 (tooling and quality gates) is queued next so we can enforce linting, formatting, and CI checks before landing feature work.
