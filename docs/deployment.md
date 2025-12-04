# Deployment Guide

This document explains how the webcast teleprompter ships to production and how to troubleshoot the Netlify pipeline.

## Hosting Overview

- **Provider:** Netlify (static SPA).
- **Build command:** `npm run build` (TypeScript project references + Vite).
- **Publish directory:** `dist/`.
- **Config:** `netlify.toml` pins the build command, Node version, and SPA redirect.

## GitHub Actions Flow

1. `build` job (`.github/workflows/ci.yml`) runs lint, Vitest, coverage, Playwright, and a prod build on every PR/main push.
2. On successful `main` pushes, the `deploy` job:
   - Re-installs dependencies (kept isolated to avoid reusing artifacts from `build` job).
   - Runs `npm run build`.
   - Executes `netlify deploy --dir=dist --prod` via `netlify/actions/cli@v5`.

### Required Secrets

Add these repository secrets so the deploy job can authenticate:

- `NETLIFY_SITE_ID` — the UUID from your Netlify site dashboard.
- `NETLIFY_AUTH_TOKEN` — personal access token scoped to “Sites: Deploy”.

### AI Script Builder environment

The Netlify function `ai-script-builder` (Azure OpenAI orchestration) reads the following env vars. Set them in both `.env.local` for local work _and_ in the Netlify site settings so production deploys can generate scripts:

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_API_VERSION` (defaults to `2024-10-01-preview` if omitted).
- `AZURE_OPENAI_DEPLOYMENT` (the GPT-5-nano deployment name/ID).

When running locally, use `npx netlify dev` so Vite and the Netlify Functions runtime share the same origin (`/.netlify/functions/ai-script-builder`). The builder UI surfaces friendly errors if the env vars are missing or the function returns a quota/auth failure—check the Netlify logs for deeper context.

## Local Deployments

Use the Netlify CLI for manual deploys or previews:

```bash
npm run build
npx netlify deploy --dir=dist --alias=preview   # smoke-test preview URL
npx netlify deploy --dir=dist --prod            # promote to production
```

Netlify stores CLI auth in `~/.netlify/config`. Do not sync that file.

## Verification Checklist

1. Run `npm run build && npm run preview` locally; sanity-check scroll, keyboard controls, and dual-view toggles.
2. Inspect the Netlify deploy logs (in GitHub Actions or Netlify UI) for warnings.
3. Hit the production URL in Chrome + Safari to double-check fonts, mirroring, and autosave storage.
4. Record the deploy in `docs/releases.md` (date, commit SHA, highlights).

## Rollback

Netlify keeps previous builds; click “Deploys → Promote” in the Netlify dashboard to roll back. Log the rollback reason in `docs/releases.md`.
