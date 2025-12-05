# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Does

**Teleprompter** is a modern web-based teleprompter application for webcast rehearsals and script generation. It features two primary workspaces:

1. **Teleprompter** – A rehearsal-focused interface with scrollable script panes, presenter controls for timing/pacing, speed adjustment, theme switching, and accessibility features.
2. **AI Script Builder** – An AI-assisted workspace powered by Azure GPT-5-nano that accepts reference files (PDF, DOCX, PPTX, TXT, Markdown), generates structured scripts via streaming, and saves drafts to a shared library.

Both workspaces share a common data model, persistence layer (localStorage), and Zustand-based state management.

## Tech Stack & Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **State Management**: Zustand (with persist middleware)
- **Styling**: Tailwind CSS + custom CSS modules (App.css)
- **Build/Dev**: Vite 7
- **Testing**: Vitest (unit/component), Playwright (e2e), React Testing Library

### Backend
- **Hosting**: Netlify (production + serverless functions)
- **AI Integration**: Azure OpenAI API (GPT-5-nano via `openai@6.10.0`)
- **Serverless Runtime**: Netlify Functions (Node.js)

### Key Libraries
- **File Parsing**: pdfjs-dist, mammoth (DOCX), jszip (PPTX), marked (Markdown), fast-xml-parser
- **Utilities**: zustand (state), jszip (binary), openai (API client)

## Project Structure

```
src/
├── views/
│   ├── teleprompter/
│   │   ├── TeleprompterView.tsx          # Main rehearsal workspace
│   │   └── components/
│   │       ├── TimerPanel.tsx
│   │       ├── SegmentNavigator.tsx
│   │       ├── ThemeSwitcher.tsx
│   │       ├── MirrorControls.tsx
│   │       ├── ScriptManager.tsx         # Import/export
│   │       └── NotesEditor.tsx
│   └── scriptBuilder/
│       ├── ScriptBuilderView.tsx         # AI builder workspace
├── store/
│   ├── teleprompterStore.ts              # Playback state, preferences, active script
│   ├── scriptBuilderStore.ts             # Prompt settings, file ingestion, streaming status
│   └── scriptLibraryStore.ts             # Persisted drafts, duplication/deletion
├── hooks/
│   ├── useAutoscroll.ts                  # Smooth scroll animation via requestAnimationFrame
│   ├── usePrompterHotkeys.ts             # Space/arrows/J/K keyboard bindings
│   ├── usePlaybackTimers.ts              # Elapsed/segment timers
│   └── useScriptBuilder.ts               # File ingestion, Azure streaming, draft persistence
├── services/
│   ├── fileExtractors/                   # PDF, DOCX, PPTX, Markdown parsers
│   └── aiScriptBuilderClient.ts          # SSE streaming from Netlify function
├── utils/
│   ├── scriptBuilder.ts                  # Draft↔Script conversions
│   ├── importExport.ts                   # JSON/Markdown import/export
│   └── storage.ts                        # localStorage helpers
├── types/
│   └── script.ts                         # Script, ScriptDraft, ScriptSource, TeleprompterState
├── App.tsx                               # Workspace nav shell
└── main.tsx                              # React entry point

netlify/
└── functions/
    └── ai-script-builder.ts              # Azure GPT call, streaming orchestration

tests/
└── e2e/                                  # Playwright keyboard/theme/library flows + axe a11y

public/                                   # Static assets (fonts, icons, favicon)
```

## Key Architectural Concepts

### State Management Pattern
- **teleprompterStore**: Persisted via Zustand `persist` middleware → `teleprompter-state-v2` localStorage key
  - Tracks: active script, playback state (isPlaying, speed), preferences (theme, font, mirror, dyslexia mode)
  - Used by autoscroll, hotkey listeners, and presenter controls
- **scriptLibraryStore**: Persists drafts → `teleprompter.script-library.v1` key
  - Tracks: ordered list of ScriptDraft objects with metadata (createdAt, updatedAt)
- **scriptBuilderStore**: In-memory state (no persist) for active builder session
  - Tracks: sources, parsing progress, streaming status, prompt settings

### UI Layout
- **Teleprompter**: Two-column grid (script pane 3fr | control pane 1.1fr) with responsive collapse to single column
- **AI Builder**: Same two-column structure with left panel for file/prompt input, right panel for output streaming
- Both use CSS Grid + flexbox with rounded panels, gradient backgrounds, and smooth transitions

### File Ingestion & Parsing
Each file upload triggers:
1. Create `ScriptSource` placeholder with `status: 'parsing'`
2. Route to appropriate extractor (PDF → pdfjs-dist, DOCX → mammoth, PPTX → jszip + XML parsing, etc.)
3. On success: set status to `ready`, store charCount, normalize content
4. On failure: set status to `error`, surface error message

### AI Script Generation Workflow
1. User uploads files, fills prompt (topic, guidance, tone, style, outline preference)
2. Click **Build script** → `useScriptBuilder` calls `generateScript()`
3. `generateScript` sends POST to `/.netlify/functions/ai-script-builder` with:
   - File content (truncated to 4k chars per file)
   - Prompt fields
   - Azure API key (injected server-side via env vars)
4. Netlify function builds structured prompt, calls Azure OpenAI with `stream: true`
5. Server-Sent Events streamed back to client as JSON: `{ event: 'progress' | 'chunk' | 'complete', ... }`
6. Client parses SSE, accumulates text into `partialContent`, displays live in output pane
7. On completion: parse draft into `ScriptDraft` object, save to library, expose "Send to teleprompter" button

### Storage Keys & Data Persistence
| Key                           | Type          | Location      |
|-------------------------------|---------------|---------------|
| `teleprompter-workspace-view` | String        | localStorage  |
| `teleprompter-state-v2`       | JSON          | localStorage  |
| `teleprompter-script-draft`   | JSON          | localStorage  |
| `teleprompter.script-library.v1` | JSON       | localStorage  |

## Common Development Commands

```bash
npm install                 # Install dependencies
npm run dev                # Start Vite dev server (no Netlify function access)
npx netlify dev            # Start Vite + Netlify dev runtime (needed for AI builder)
npm run build              # Type-check (tsc -b) + Vite production bundle
npm run preview            # Serve built dist/ locally
npm run lint               # ESLint + type-aware rules + Tailwind plugin
npm run test               # Vitest watch mode
npm run test:run           # Vitest single run (CI mode)
npm run test:coverage      # Generate Istanbul coverage (≥80% statements threshold)
npm run test:e2e           # Playwright tests (requires test server running)
npm run test:e2e:ui        # Playwright inspector
npm run format             # Prettier format
npm run typecheck          # TypeScript project reference build
```

## Testing

### Unit & Component Tests
- Located next to modules (`Component.test.tsx`, `hook.test.ts`)
- Use Vitest + React Testing Library + jsdom
- Reset shared stores between tests via `beforeEach` or test fixtures
- Coverage threshold: ≥80% statements (`coverage/summary.json`)
- Run: `npm run test` (watch) or `npm run test:run` (CI)

### End-to-End (Playwright)
- Tests in `tests/e2e/**/*.spec.ts`
- Cover keyboard flows (space to play, arrows to speed, J/K to jump), theme switching, library management
- Accessibility checks via `@axe-core/playwright`
- Requires dev server: `npm run dev` in one terminal, then `npm run test:e2e` in another
- Debug mode: `npm run test:e2e:ui`

## Deployment & CI/CD

### Build & Deploy
- GitHub Actions (`.github/workflows/ci.yml`):
  1. Install dependencies
  2. Lint, unit tests, coverage check (≥80%)
  3. Playwright e2e suite
  4. Build production bundle
  5. Deploy to Netlify (only on main branch, if all tests pass)

### Environment Configuration
- Local dev: Create `.env.local` with Azure credentials:
  ```
  AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
  AZURE_OPENAI_API_KEY=<key>
  AZURE_OPENAI_API_VERSION=2024-10-01-preview
  AZURE_OPENAI_DEPLOYMENT=gpt-5-nano
  ```
- Production: Set secrets in Netlify dashboard (used by Netlify Functions at runtime)

### Manual Deploy
```bash
npm run build
npx netlify deploy --dir=dist --alias=preview  # Preview
npx netlify deploy --dir=dist --prod           # Production (if manual)
```

### Documentation
- Record deployments in `docs/releases.md`
- Update `CHANGELOG.md` with user-facing changes
- Take screenshots for UI changes (store in `docs/media/`)

## Coding Style & Conventions

### TypeScript & React
- Functional components only (no class components)
- Hooks for side effects and state logic
- Prefer `const` with explicit types where ambiguous
- Use `eslint-plugin-react-hooks`, `@typescript-eslint`
- 2-space indentation, single quotes, semicolons

### File Naming
- React components: PascalCase (`SegmentNavigator.tsx`)
- Hooks: camelCase with `use` prefix (`useAutoscroll.ts`)
- Zustand stores: `*Store.ts` (`teleprompterStore.ts`)
- Tests: colocated with source or in `tests/e2e/` (`Component.test.tsx`)

### CSS & Tailwind
- Prefer Tailwind utility classes
- Complex/repeated patterns: add custom CSS to `App.css`
- CSS Grid + flexbox for layout
- Dark/light/high-contrast themes via CSS variables in `index.css` (managed by theme switcher)

### Accessibility
- Semantic HTML: `<section>`, `<aside>`, `<button>`, `<label>`
- ARIA attributes where needed: `aria-label`, `aria-pressed`, `aria-live`
- Keyboard navigation: space to play/pause, arrows to nudge speed, J/K to jump segments
- Color contrast: high-contrast theme option available
- Font support: Atkinson Hyperlegible (dyslexia-friendly) togglable
- Tests: Axe accessibility checks in both Vitest (`vitest-axe`) and Playwright (`@axe-core/playwright`)

## Related Documentation

- `README.md` – User-facing overview, feature tour, quick start
- `AGENTS.md` – Repository guidelines, structure, commit conventions
- `docs/deployment.md` – CI/CD pipeline, secrets, rollback
- `docs/releases.md` – Deployment log (mirror `CHANGELOG.md`)
- `plans/teleprompter-plan.md` – Long-form architecture notes and scope decisions
- `examples/sample-show.md` – Markdown import format reference

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Netlify function not accessible | Use `npx netlify dev` instead of `npm run dev` |
| localStorage state stuck | Clear browser DevTools → Application → localStorage, remove keys listed above |
| File parsing fails (>10MB) | Files over 10 MB are rejected; split or trim inputs |
| Tests hang on file extraction | File extraction is excluded from coverage (uses native binary parsers); tested via Netlify smoke tests |
| Playwright browsers fail | Run `npx playwright install --with-deps` once per machine |
| Type errors on build | Run `npm run typecheck` for isolated project reference diagnostics |
