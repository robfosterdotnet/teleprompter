# Teleprompter (web)

Modern web-based teleprompter for webcast rehearsals and script generation. The app ships two workspaces—a rehearsal-focused teleprompter and an AI-assisted script builder—sharing a common data model, persistence layer, and deployment pipeline.

## Quick start

```bash
npm install
npm run dev
```

Open the printed localhost URL to view the workspace shell. `npm run dev` boots Vite with hot reload; use `npx netlify dev` whenever you need the Netlify Functions runtime for AI generation.

## Feature tour

- **Teleprompter workspace** – Scrollable script pane plus presenter controls for timers, typography, mirroring, and live segment navigation. Autosave keeps edits in `localStorage` so rehearsals survive refreshes.
- **Presenter controls** – Hooks such as `useAutoscroll`, `usePrompterHotkeys`, and `usePlaybackTimers` keep scroll speed, keyboard shortcuts, and timers in sync with the Zustand store. Controls surface speed nudges, jump-to-segment, theme switches, mirror toggles, and dyslexic-friendly fonts.
- **Script manager + library** – Import/export Markdown or JSON rundowns, attach notes per segment, and persist drafts in the script library (`useScriptLibraryStore`) for quick recall or duplication.
- **AI Script Builder** – Upload up to five reference files (PDF, DOCX, PPTX, TXT, Markdown), describe the topic, tone, and style, then stream a draft from Azure GPT-5-nano. Drafts save to the shared library and can be pushed into the teleprompter view with one click.
- **Accessibility & theming** – Keyboard-first navigation (space to play/pause, arrows to nudge speed, J/K to swap segments), dark/light/high-contrast themes, mirror controls, and dyslexic-safe typography. Axe checks run in both Vitest and Playwright suites.

## Architecture overview

### UI shell & views

- `src/App.tsx` renders a workspace nav that persists the last view in `localStorage` (`teleprompter-workspace-view`).
- `src/views/teleprompter/TeleprompterView.tsx` hosts the rehearsal UI, composed of sub-panels (`SegmentNavigator`, `TimerPanel`, `ThemeSwitcher`, `MirrorControls`, `ScriptManager`, `NotesEditor`).
- `src/views/scriptBuilder/ScriptBuilderView.tsx` powers the AI workspace, coordinating file drops, prompt controls, draft streaming status, and library management.

### State management & persistence

- **Teleprompter store** (`src/store/teleprompterStore.ts`) uses Zustand with `persist` to mirror playback state, preferences, and the active script under `teleprompter-state-v2`. Autosave writes script drafts to `localStorage` via `saveScriptDraft`, and metadata timestamps update on every edit/import.
- **Script builder store** (`src/store/scriptBuilderStore.ts`) tracks prompt settings, ingestion progress, and streaming status for AI runs. It guards file limits, surfaces parsing failures, and exposes derived metrics such as estimated token count.
- **Script library store** (`src/store/scriptLibraryStore.ts`) is another persisted Zustand slice (`teleprompter.script-library.v1`) that keeps drafts ordered by most-recent updates, supports duplication/rename, and remains shareable across both workspaces.

### Hooks & controllers

- `useAutoscroll` animates the script pane using `requestAnimationFrame`, clamping to the container height and honoring real-time speed changes.
- `usePrompterHotkeys` binds space/arrow/J/K keys to playback controls, respecting focus guards and accessibility hints.
- `usePlaybackTimers` (consumed by `TimerPanel`) tracks elapsed and segment timers without drifting when paused.
- `useScriptBuilder` is a façade that unifies file ingestion, Azure OpenAI streaming (via `generateScript`), abort handling, and draft persistence.

### Services & data flow

- **File extraction** (`src/services/fileExtractors`) normalizes PDFs (`pdfjs-dist`), DOCX (`mammoth` + XML fallback), PPTX (zip parsing), Markdown (`marked`), and plain text before they ever leave the browser. Each ingest yields a `ScriptSource` with metadata, preview snippet, and normalized content.
- **AI client** (`src/services/aiScriptBuilderClient.ts`) streams events from `/.netlify/functions/ai-script-builder`, parsing Server-Sent Events into progress, chunk, and completion events while allowing cancellation through `AbortController`.
- **Netlify function** (`netlify/functions/ai-script-builder.ts`) validates payloads, truncates oversized inputs, builds structured prompts, calls Azure GPT-5-nano via the official SDK, and streams normalized JSON back to the client alongside audit data (request id, token usage, source provenance).

### Persistence & storage keys

| Purpose                   | Storage key / location                      |
| ------------------------- | ------------------------------------------- |
| Workspace selection       | `teleprompter-workspace-view` (local)       |
| Teleprompter state        | `teleprompter-state-v2` (Zustand persist)   |
| Script draft autosave     | `teleprompter-script-draft` (utils/storage) |
| Script library            | `teleprompter.script-library.v1`            |
| AI builder prompt/sources | In-memory via `useScriptBuilderStore`       |

### Directory map

- `src/views/teleprompter` – Script pane + presenter controls.
- `src/views/scriptBuilder` – AI workspace UI and prompt forms.
- `src/store/` – Zustand stores for teleprompter, builder, and library.
- `src/hooks/` – Cross-cutting hooks (timers, hotkeys, autoscroll orchestration, script builder controller).
- `src/services/` – File extraction pipeline and AI client.
- `src/utils/` – Markdown/JSON parsing, script import/export helpers, storage utilities.
- `src/types/` – Shared TypeScript models (`Script`, `ScriptDraft`, `TeleprompterState`, builder requests).
- `netlify/functions/` – Serverless handlers (currently `ai-script-builder`).
- `tests/` – Playwright end-to-end flows; Vitest specs live next to the modules they validate.

## Data models & formats

- **Script (`src/types/script.ts`)** – Each script contains metadata (`title`, `presenter`, `lastEditedIso`) plus ordered `segments` (id, title, body, optional notes and target durations). Teleprompter preferences reference `segmentId` to know which block is active.
- **ScriptDraft** – AI builder outputs include outline arrays, section breakdowns, CTA text, summary, usage metrics, and audit metadata. Drafts keep source references so downstream reviewers can trace each section back to the uploaded research files.
- **ScriptSource** – Represents extracted files, capturing filename, mime type, char counts, preview excerpts, normalized text, and parser status/error message. These feed into Azure requests and audit logs.
- **Telemetry & timestamps** – `stampScriptMetadata` updates `lastEditedIso` on every save/import, while the library store stamps `createdAt`/`updatedAt` when drafts are (re)stored.

## AI Script Builder workflow

1. **Context ingestion** – `useScriptBuilder` caps uploads at five files (`MAX_SOURCES`). Each file becomes a placeholder `ScriptSource`, then runs through the appropriate extractor. Users see parsing progress, errors, and character counts per file.
2. **Prompt prep** – The hook compiles the sanitized prompt (topic, guidance, tone, style, outline preference) and trims each source to 4,000 characters before calling the Netlify function.
3. **Serverless orchestration** – `netlify/functions/ai-script-builder.ts` validates payloads, builds a system + user prompt, calls Azure GPT-5-nano with streaming enabled, and pipes structured events back to the browser (progress, partial content, completion, errors).
4. **Client streaming** – `generateScript` parses SSE chunks, appends text to the in-progress draft, and resolves with a fully structured `ScriptDraft` plus usage stats. The hook saves the draft to the library, updates status messages, and exposes helpers to send the draft to the teleprompter view.
5. **Auditability** – Every draft stores the file names used, request id, and optional warnings so production teams can reconstruct sourcing if needed.

### Local configuration

Create `.env.local` with your Azure resource settings:

```bash
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_API_VERSION=2024-10-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-nano
```

Then run the Netlify dev server so the function is reachable:

```bash
npx netlify dev
```

Switch to **AI Builder**, drop files, describe the topic, and click **Build script**. Use **Cancel** to abort long generations; status toasts reflect the current phase (ingesting, streaming, ready).

## Testing & quality gates

- **Unit/UI tests** – `npm run test` (watch) or `npm run test:run` (CI) executes Vitest with React Testing Library and jsdom. Hooks/components reset shared stores between specs. Accessibility assertions live in `App.a11y.test.tsx`.
- **Coverage** – `npm run test:coverage` produces Istanbul output in `coverage/`, enforcing ≥80% statements. Review `coverage/summary.json` for CI thresholds.
- **End-to-end** – `npm run test:e2e` launches Playwright keyboard/theme flows against a dev server, covering dual-view rendering, import/export, and accessibility scans via `@axe-core/playwright`. Use `npm run test:e2e:ui` for the inspector.
- **Linting & formatting** – `npm run lint` runs ESLint with TypeScript + Tailwind plugins; `npm run format` applies Prettier. Husky hooks run lint-staged plus the Vitest single pass before each commit.
- **CI** – `.github/workflows/ci.yml` installs deps, runs lint/tests/coverage, executes the Playwright suite, builds the production bundle, and deploys to Netlify on green pushes to `main`.

## Available scripts

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

## Deployment

- **Target** – Netlify hosts production; `netlify.toml` declares the Vite build command and SPA redirect rules.
- **Pipeline** – GitHub Actions run lint/tests/build, then a deploy job executes `netlify deploy --prod` using `NETLIFY_SITE_ID` + `NETLIFY_AUTH_TOKEN`. Main must stay green before deploy.
- **Manual** – For smoke tests, run `npm run build` followed by `npx netlify deploy --dir=dist --alias=preview`. Promote to prod with `--prod`. Always capture screenshots/gifs for `docs/media/` when UI changes land.
- **Docs & change logs** – Record each deployment in `docs/releases.md` and summarize user-facing updates in `CHANGELOG.md`.

## Troubleshooting & diagnostics

- **Missing env vars** – The Netlify function logs missing Azure keys at boot. Check your `.env.local`, restart `npx netlify dev`, and verify environment settings inside the Netlify dashboard for production.
- **Binary parsing limits** – Files over 10 MB fail ingestion. The dropzone surfaces an error; trim decks/documents or split them into smaller uploads.
- **Playwright dependencies** – Run `npx playwright install --with-deps` once per machine. If browsers fail to launch in sandboxed shells, run tests locally.
- **Autosave conflicts** – Delete `localStorage` keys (see table above) to reset state if scripts or preferences get stuck.

## Additional references

- `docs/deployment.md` – CI ↔ Netlify integration, required secrets, rollback steps.
- `docs/releases.md` – Release log mirrored in `CHANGELOG.md`.
- `docs/knowledge-transfer.md` – Architecture deep dive, TODOs, onboarding checklist.
- `plans/teleprompter-plan.md` – Long-form planning notes and scope changes (keep updated when the roadmap shifts).
- `examples/sample-show.md` – Markdown format reference for importing rundowns.

Questions or missing context? Open an issue or update `plans/decision-log.md` so future maintainers inherit the rationale behind changes.
