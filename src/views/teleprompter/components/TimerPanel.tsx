import { usePlaybackTimers } from '@/hooks/usePlaybackTimers'

export const TimerPanel = () => {
  const { elapsedLabel, etaLabel, totalLabel, resetElapsed } = usePlaybackTimers()

  return (
    <section className="timer-panel" aria-label="Timing widgets">
      <header>
        <h3>Timing</h3>
        <button type="button" onClick={resetElapsed}>
          Reset
        </button>
      </header>
      <dl>
        <div>
          <dt>Elapsed</dt>
          <dd>{elapsedLabel}</dd>
        </div>
        <div>
          <dt>ETA</dt>
          <dd>{etaLabel}</dd>
        </div>
        <div>
          <dt>Estimated total</dt>
          <dd>{totalLabel}</dd>
        </div>
      </dl>
    </section>
  )
}
