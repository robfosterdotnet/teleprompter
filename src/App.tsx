import './App.css'

const SAMPLE_SEGMENTS = [
  {
    title: 'Opening Hook',
    script:
      'Welcome to the webcast. Today we are lifting the curtain on the teleprompter build so you can follow every production cue with confidence.',
  },
  {
    title: 'Feature Hits',
    script:
      'Expect adjustable scroll speed, presenter notes, and dual-display mirroring. Each control will live in the panel to the right for quick access.',
  },
  {
    title: 'Call to Action',
    script:
      'Try loading your own script once persistence lands. For now, skim this placeholder content to visualize where your story will scroll.',
  },
]

const PLACEHOLDER_SPEED = { value: 1.0, unit: 'x' }

function App() {
  return (
    <main className="app-shell">
      <section className="script-pane" aria-label="Script preview">
        <header className="pane-header">
          <p className="eyebrow">Teleprompter Preview</p>
          <h1>Webcast rehearsal sandbox</h1>
          <p className="lede">
            This placeholder view represents the primary reading pane that will
            auto-scroll during a live session.
          </p>
        </header>

        <ol className="segment-list">
          {SAMPLE_SEGMENTS.map((segment) => (
            <li key={segment.title} className="segment-card">
              <p className="segment-label">{segment.title}</p>
              <p className="segment-script">{segment.script}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="control-pane" aria-label="Presenter controls">
        <header>
          <p className="eyebrow">Presenter controls</p>
          <h2>Next up</h2>
          <p className="lede">
            Hooks for timers, notes, and keyboard shortcuts will connect here in
            later tasks. Use this area to map the workflow before coding.
          </p>
        </header>

        <dl className="status-grid">
          <div>
            <dt>Scroll speed</dt>
            <dd>{PLACEHOLDER_SPEED.value.toFixed(1) + PLACEHOLDER_SPEED.unit}</dd>
          </div>
          <div>
            <dt>Active segment</dt>
            <dd>{SAMPLE_SEGMENTS[0].title}</dd>
          </div>
          <div>
            <dt>Timer</dt>
            <dd>00:00:00</dd>
          </div>
        </dl>

        <section className="notes-block">
          <p className="segment-label">Notes lane</p>
          <p className="segment-script">
            Invite producers to jot reminders (camera cues, sponsor reads, Q&A
            prompts). Autosave + import/export ship in Task 7.
          </p>
        </section>
      </aside>
    </main>
  )
}

export default App
