import { useTeleprompterStore } from '@/store/teleprompterStore'

export const MirrorControls = () => {
  const preferences = useTeleprompterStore((state) => state.preferences)
  const setPreferences = useTeleprompterStore((state) => state.setPreferences)

  return (
    <section className="mirror-controls" aria-label="Mirroring options">
      <p className="segment-label">Mirror output</p>
      <div className="mirror-button-row">
        <button
          type="button"
          aria-pressed={preferences.mirroredX}
          onClick={() => setPreferences({ mirroredX: !preferences.mirroredX })}
        >
          Horizontal
        </button>
        <button
          type="button"
          aria-pressed={preferences.mirroredY}
          onClick={() => setPreferences({ mirroredY: !preferences.mirroredY })}
        >
          Vertical
        </button>
        {(preferences.mirroredX || preferences.mirroredY) && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => setPreferences({ mirroredX: false, mirroredY: false })}
          >
            Reset
          </button>
        )}
      </div>
    </section>
  )
}
