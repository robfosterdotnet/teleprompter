# Changelog

All notable changes to this project will be documented in this file following [Keep a Changelog](https://keepachangelog.com/) and [SemVer](https://semver.org/).

## [Unreleased]

### Added

- AI Script Builder workspace with file ingestion, Azure GPT-5-nano streaming, and a local draft library that can push content into the teleprompter view.
- Netlify serverless function `ai-script-builder` plus extraction services for PDF/DOCX/PPTX/TXT/Markdown inputs.
- Navigation pill in `App.tsx` so presenters can switch between the teleprompter and AI builder.

### Changed

- README + deployment docs now cover Azure env vars, Netlify dev workflow, and builder usage.
- AI Script Builder no longer requires file uploads and hides temperature/max-token controls to match Azure’s GPT-5-nano API surface.

### TODO

- Surface upcoming backlog items (speech control, cloud sync) once scoped.

## [1.0.0] - 2024-12-04

### Added

- Automated Netlify deployment (Task 9) with `netlify.toml` and GitHub Actions deploy job.
- Deployment + release documentation (`docs/deployment.md`, `docs/releases.md`) and architecture notes.
- Changelog + knowledge transfer docs to keep onboarding smooth (Task 10).

### Fixed

- Ensured README/AGENTS/plan accurately describe dev/test/deploy workflows.

### Notes

- Screenshot capture (`docs/media/presenter-view.png`) must run on a non-sandboxed macOS shell due to Chrome crash-reporter permissions; see README for the command.
