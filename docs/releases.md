# Release Log

Document each production deploy so we can trace regressions quickly. When Task 9 deploys run, append a new section with:

- Date (UTC).
- Git commit SHA / tag.
- Summary (1–2 bullets).
- Verification notes (lint/test/deploy status, manual QA).

## 2024-12-04 — Initial Netlify Pipeline

- **Commit:** `main@HEAD` (see GitHub history for exact SHA).
- **Highlights:** Added `netlify.toml`, automated Netlify deploy job, refreshed README/docs/plan to cover Tasks 9–10.
- **Verification:** `npm run build`, Vitest + Playwright (CI), manual `npm run preview`.
- **Follow-up:** Capture updated screenshots (`docs/media/presenter-view.png`) once Playwright can launch outside the Codex sandbox.
