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

## Feature Plan: AI Script Builder powered by Azure GPT-5-nano

### Why now

- Producers need a fast way to turn long-form reference material (presentations, PDFs, Word docs, briefs) into teleprompter-ready scripts without copy/paste churn.
- Consistent opening templates, tone, and timing are easier to enforce when an AI assistant drafts the base script from inputs that the presenter owns.
- Persisted script drafts must be re-openable so show-runners can iterate across rehearsals without rebuilding context every time.

### User stories & acceptance criteria

1. **Upload & context** — When I drop up to 5 supporting files (PDF, DOCX, PPTX, TXT, Markdown) and optionally type topic guidance, the app extracts plain text previews, shows token counts, and warns if extraction fails so I can fix inputs before generation.
2. **Script generation** — When I click “Build script,” the system sends the extracted text + topic guidance to Azure OpenAI GPT-5-nano through the OpenAI SDK and displays a streaming progress indicator. Success returns a structured draft (title, outline bullets, full narration) auto-loaded into the teleprompter editor; failure surfaces actionable errors (quota, timeout, validation).
3. **Blank start default** — Loading the builder always opens an empty script canvas; previous drafts do not pre-fill the editor unless explicitly loaded via the library drawer.
4. **Script library** — I can save the draft with a friendly name, see it in a list sorted by last edited time, reopen it later (including across sessions/browsers via local persistence), duplicate it, or delete it.
5. **Audit trail** — Every generated script stores metadata (source files used, GPT parameters, timestamp) visible in a side panel for compliance/reference.

### Experience blueprint

- Add a new “AI Script Builder” workspace accessible from the primary nav (icon button near “Scripts”).
- Left column: file drop zone + guidance textbox + tone/style selectors + estimated cost.
- Right column: AI output preview with segmented structure (Title → Hook → Body → CTA) and “Send to Teleprompter” button that fills the existing active script.
- Script library drawer accessible from header to manage saved drafts; uses search + tags.
- Empty state card describes the 3-step flow (add files → describe intent → build script).

### Technical blueprint

**Data & types**

- Extend `src/types/script.ts` with `ScriptDraft`, `ScriptSource`, `ScriptMetadata`. Each draft stores `id`, `title`, `content`, `outline`, `createdAt`, `updatedAt`, `sources: ScriptSource[]`, and `modelConfig`.
- Normalize file ingests to `{ id, filename, mimeType, charCount, preview, status }`.

**File ingestion pipeline**

- Create `src/services/fileExtractors/` with async extractors per MIME bucket:
  - DOCX/DOC — use `mammoth` in a Web Worker to convert to HTML → strip tags.
  - PDF — leverage `pdfjs-dist` to read each page text layer; guard against password/encrypted failures.
  - PPTX — read zipped XML via `jszip` + `fast-xml-parser` to pull slide text.
  - Plain text/Markdown — `FileReader` + optional Markdown-to-text (e.g., `marked` parser).
- Wrap extractors with `extractPlainText(file: File): Promise<ScriptSource>` that enforces max size (e.g., 10 MB) and returns normalized text segments. Show incremental status updates in UI (`pending → parsing → ready/error`).
- Add unit tests for happy/edge paths per extractor.

**Azure OpenAI orchestration (serverless)**

- Add `openai` npm dependency (which includes the `AzureOpenAI` helper) plus optional `@azure/identity` if we later adopt Azure AD tokens. For now, use API key auth stored server-side.
- Create `netlify/functions/ai-script-builder.ts` (or Vite server handler) that:
  1. Validates POST payload (`topic`, `tone`, `outlinePreference`, `sources[]`, `previousScriptId?`).
  2. Summarizes large source blobs down to ~8k tokens using heuristic chunking.
  3. Calls Azure OpenAI GPT-5-nano via `client.responses.create` with system instructions describing teleprompter format, using env vars from `.env` (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT`, etc.).
  4. Streams partial chunks back to the client (use `ReadableStream` response) so progress UI can update.
  5. Logs model usage + request ID for debugging.
- Error handling should map SDK exceptions to 4xx/5xx payloads and include guidance (retry-after, invalid file, etc.).

**Client consumption**

- Build `src/services/aiScriptBuilderClient.ts` that wraps `fetch('/.netlify/functions/ai-script-builder')` with AbortController support, returns `ScriptDraft`.
- Create `src/hooks/useScriptBuilder.ts` (Zustand slice or React Query mutation) to manage UI state: selected files, extraction queue, prompt form, generation status, streamed content assembly.

**Persistence**

- Extend existing Zustand store or add `src/store/scripts.slice.ts` with `persist` middleware pointing to IndexedDB/localStorage key `teleprompter.script-library.v1`.
- Provide actions: `saveDraft`, `loadDraft`, `deleteDraft`, `duplicateDraft`, `syncFromTeleprompter`. Ensure migrations handle schema bumps.

**Security**

- Never expose Azure API key to the browser; only serverless functions talk to Azure.
- Sanitize extracted text before sending to Azure (strip binary, ensure UTF-8) to prevent prompt injection via embedded scripts.

### Detailed task breakdown for implementation

1. **Discovery & UX** — Create low-fidelity wireframes covering the builder view, streaming states, library drawer, and error toasts. Review with stakeholders before coding.
2. **Data modeling** — Define TypeScript interfaces + Zustand slice scaffolding (`src/types/script-builder.ts`, `src/store/scripts.slice.ts`) and write unit tests ensuring reducers behave.
3. **File extraction services** — Implement extractor modules + Web Worker setup, integrate with drop zone component, and add unit tests plus manual fallbacks (show “Open file externally” CTA when extraction fails).
4. **Serverless AI endpoint** — Scaffold Netlify function, wire env vars, add OpenAI SDK client, implement request validation + streaming response, and log telemetry (Netlify function logging). Include Vitest unit covering prompt builder and integration test using `msw` to mock Azure responses.
5. **Client integration** — Build `useScriptBuilder` hook, React Query mutation, and React components for upload list, prompt form, AI progress indicator, and script output panel. Ensure script insertion respects “blank canvas” rule.
6. **Script library** — Implement drawer/list UI with search + filters, integrate with persistence slice, and add ability to push selected draft into the main teleprompter editor.
7. **Testing** — Extend Vitest suites for hooks/components, add MSW mocks for the Netlify endpoint, and write a Playwright spec (`tests/e2e/script-builder.spec.ts`) that uploads a fixture file, generates a mock script, saves, reloads, and verifies persistence.
8. **Docs & Ops** — Update `README.md` (usage + env vars), `docs/deployment.md` (Netlify function instructions), and `plans/decision-log.md` with rationale for Azure-model usage. Capture release notes entry.

### Pseudocode / reference snippets

> SDK usage references draw from the OpenAI Node `AzureOpenAI` examples (Context7: https://github.com/openai/openai-node/blob/master/azure.md) adapted to our env variables.

**Environment additions (`.env.local`)**

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-10-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5-nano
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_REQUEST_TIMEOUT_SECONDS=30
AZURE_OPENAI_MAX_RETRIES=3
```

**Netlify function skeleton (`netlify/functions/ai-script-builder.ts`)**

```ts
import { AzureOpenAI } from 'openai'
import type { Handler } from '@netlify/functions'

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
})

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const payload: ScriptBuilderRequest = JSON.parse(event.body ?? '{}')
  validate(payload) // throw with 400 on failure

  const prompt = buildPrompt(payload) // merges topic + extracted text summaries
  const stream = await client.responses.stream({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    input: [
      { role: 'system', content: SYSTEM_INSTRUCTIONS },
      { role: 'user', content: prompt },
    ],
    max_output_tokens: payload.maxTokens ?? 1800,
    temperature: payload.temperature ?? 0.4,
  })

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

export { handler }
```

**Client helper (`src/services/aiScriptBuilderClient.ts`)**

```ts
export async function generateScript(input: ScriptBuilderRequest, signal?: AbortSignal) {
  const res = await fetch('/.netlify/functions/ai-script-builder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  if (!res.ok) throw await normalizeError(res)
  return consumeStream(res.body) // convert SSE to ScriptDraft
}
```

**Hook sketch (`src/hooks/useScriptBuilder.ts`)**

```ts
export function useScriptBuilder() {
  const [sources, setSources] = useState<ScriptSource[]>([])
  const mutation = useMutation({
    mutationFn: (payload: BuildScriptPayload) =>
      generateScript(payload, abortController.signal),
  })

  const addFiles = async (files: FileList | File[]) => {
    const parsed = await Promise.allSettled([...files].map(extractPlainText))
    setSources(reconcileSources(parsed))
  }

  return {
    sources,
    addFiles,
    build: mutation.mutate,
    isBuilding: mutation.isPending,
    progress: mutation.data?.progress ?? 0,
  }
}
```

**File extraction helper (`src/services/fileExtractors/index.ts`)**

```ts
export async function extractPlainText(file: File): Promise<ScriptSource> {
  if (file.size > MAX_FILE_BYTES) throw new Error('File exceeds 10 MB limit')
  switch (true) {
    case /pdf$/.test(file.name):
      return extractPdf(file)
    case /(doc|docx)$/i.test(file.name):
      return extractDocx(file)
    case /(ppt|pptx)$/i.test(file.name):
      return extractPptx(file)
    default:
      return extractText(file)
  }
}
```

**Zustand slice (`src/store/scripts.slice.ts`)**

```ts
type ScriptStore = {
  drafts: Record<string, ScriptDraft>
  currentDraftId?: string
  saveDraft: (draft: ScriptDraft) => void
  loadDraft: (id: string) => void
  deleteDraft: (id: string) => void
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveDraft: (draft) =>
        set({ drafts: { ...get().drafts, [draft.id]: draft }, currentDraftId: draft.id }),
      loadDraft: (id) => set({ currentDraftId: id }),
      deleteDraft: (id) => {
        const drafts = { ...get().drafts }
        delete drafts[id]
        set({
          drafts,
          currentDraftId: drafts[currentDraftId] ? currentDraftId : undefined,
        })
      },
    }),
    { name: 'teleprompter.script-library.v1' },
  ),
)
```

### Testing & verification checklist

- Vitest suites for extractors, prompt builder, Zustand slice, and React components (use MSW to stub Netlify function).
- Playwright scenario: upload fixture, generate mocked response, save draft, reload page, reopen draft, push to teleprompter view.
- Manual QA: verify streaming UI on slow network, cancellation, retry after failure, localStorage persistence across refreshes, and handling of corrupted PDFs.

### Risks & mitigations

- **File parsing complexity** — Start with high-value formats (PDF/DOCX) and mark PPTX/others as “beta” if extraction libraries prove flaky. Provide fallback instructions (e.g., “Save as PDF first”).
- **Token overruns** — Implement chunking + summarization before hitting Azure; show estimated tokens + guardrails.
- **Secrets exposure** — Keep Azure key server-side; add CI check ensuring no `AZURE_OPENAI_*` keys leak to client bundle.
- **Latency** — Stream responses and show progress; add cancellation + “keep editing while generating” message.
- **Future backend needs** — If local persistence proves insufficient, plan follow-up to sync drafts to a durable backend (Supabase/Firestore) while keeping interfaces consistent.

### Implementation status (2025-02-XX)

- ✅ Workspace switcher + AI Script Builder view with streaming status, prompt controls, topic-only generation, and “Send to Teleprompter” hand-off.
- ✅ File ingestion services (`src/services/fileExtractors`) supporting TXT/Markdown/PDF/DOCX/PPTX plus upload limits/status chips in the UI.
- ✅ Azure GPT-5-nano Netlify function (`netlify/functions/ai-script-builder.ts`) streaming SSE progress + completion events with audit metadata (temperature/max-tokens omitted per API limits).
- ✅ Persistent draft library (`src/store/scriptLibraryStore.ts`) with duplicate/delete actions surfaced via the builder drawer.
- ✅ `useScriptBuilder` hook coordinates uploads, status, saving, and library selection.
- ⚠️ TODOs: add MSW-backed generator tests, expand Playwright flows to cover uploads → save → reload, and handle Azure quota/rate-limit hints in the UI to improve recoverability.
