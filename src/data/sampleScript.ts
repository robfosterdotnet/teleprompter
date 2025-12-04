import type { Script } from '@/types/teleprompter'

export const SAMPLE_SCRIPT: Script = {
  id: 'sample-script',
  metadata: {
    title: 'Webcast rehearsal sandbox',
    presenter: 'Production Team',
    lastEditedIso: new Date('2025-12-01T12:00:00Z').toISOString(),
  },
  segments: [
    {
      id: 'opening-hook',
      title: 'Opening Hook',
      body: 'Welcome to the webcast. Today we are lifting the curtain on the teleprompter build so you can follow every production cue with confidence. Picture the stage lights warming up, producers counting down, and your first lines carrying the tone for the broadcast.',
    },
    {
      id: 'feature-hits',
      title: 'Feature Hits',
      body: 'Expect adjustable scroll speed, presenter notes, and dual-display mirroring. Each control will live in the panel to the right for quick access. We are prioritizing tactile interactions—spacebar to pause, J or K to hop segments, and range sliders to dial in typography.',
    },
    {
      id: 'call-to-action',
      title: 'Call to Action',
      body: 'Try loading your own script once persistence lands. For now, skim this placeholder content to visualize where your story will scroll. The current sample is intentionally verbose so QA can observe steady motion across multiple viewports.',
    },
    {
      id: 'story-beat-one',
      title: 'Story Beat — Planning',
      body: 'During pre-production, we capture every show beat in a shared document. Segments include camera framing, cue words, and contingency notes for breaking news. The teleprompter mirrors that structure by letting you tag scenes, highlight anchors, and pace transitions with scroll speed cues.',
    },
    {
      id: 'story-beat-two',
      title: 'Story Beat — Design Decisions',
      body: 'Why Zustand over Redux Toolkit? The footprint stays lean, action creators are ergonomic, and we can wrap persistence middleware with minimal boilerplate. As the project scales into timers, importers, and external data, the store remains approachable for contributors joining mid-stream.',
    },
    {
      id: 'story-beat-three',
      title: 'Story Beat — Accessibility',
      body: 'WCAG compliance matters even for internal tools. High contrast palettes keep readability intact under stage lighting, dyslexic-friendly fonts remove visual ambiguity, and keyboard-first navigation ensures presenters never chase a mouse when adrenaline spikes.',
    },
    {
      id: 'story-beat-four',
      title: 'Story Beat — Dual Displays',
      body: 'Confidence monitors mirror the script for panelists, while the control surface anchors on the primary laptop. Horizontal and vertical mirroring modes will let stage techs flip output for teleprompter glass without complex AV routing.',
    },
    {
      id: 'story-beat-five',
      title: 'Story Beat — Timing Tools',
      body: 'Timers sync with scroll velocity to estimate remaining script duration. Down the road we will warn presenters when they drift from the planned cadence, nudging them to improvise or compress remarks before the next segment begins.',
    },
    {
      id: 'story-beat-six',
      title: 'Story Beat — Persistence',
      body: 'LocalStorage autosave prevents lost edits during rehearsals. Eventually we can introduce export targets (Markdown, JSON) plus optional cloud sync so traveling teams load the same rundown regardless of device.',
    },
    {
      id: 'closing-recap',
      title: 'Closing Recap',
      body: 'Thanks for stress-testing the teleprompter. Keep experimenting with speed multipliers, typography controls, and hotkeys. Each rehearsal provides telemetry on which UX refinements to tackle next.',
    },
  ],
}
