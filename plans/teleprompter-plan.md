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
- **State & Persistence:** Zustand or Redux Toolkit for deterministic playback controls; persist scripts via localStorage/IndexedDB.
- **Scrolling Engine:** requestAnimationFrame-driven loop with easing controls; consider `react-window` if scripts become large.
- **Desktop Option:** Ship as PWA first; wrap with Tauri/Electron if native menus or global shortcuts become essential.
- **Tooling:** ESLint + Prettier, Vitest + React Testing Library for unit/UI coverage, and Playwright for keyboard/dual-screen automations.
- **CI/CD:** GitHub Actions pipeline to lint, test, and deploy to Vercel/Netlify.

## Next Steps
1. Confirm target platform (web-only vs desktop wrapper) and finalize MVP scope.
2. Scaffold React project, define script/segment data models, and implement scroll controller prototype.
3. Add theming + dual-view layouts, then integrate persistence and import/export flows.
4. Automate testing in CI and gather feedback from a dry-run webcast.
