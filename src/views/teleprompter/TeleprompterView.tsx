import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useAutoscroll } from '@/scroll/useAutoscroll'
import { usePrompterHotkeys } from '@/hooks/usePrompterHotkeys'
import { SegmentNavigator } from './components/SegmentNavigator'
import { TimerPanel } from './components/TimerPanel'
import { NotesEditor } from './components/NotesEditor'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { MirrorControls } from './components/MirrorControls'
import { ScriptManager } from './components/ScriptManager'
import {
  selectActiveSegment,
  selectPlayback,
  selectPreferences,
  selectScript,
  selectSegments,
  useTeleprompterStore,
} from '@/store/teleprompterStore'

const SPEED_STEP = 0.1
const FONT_MIN = 0.8
const FONT_MAX = 1.6
const LINE_MIN = 1.1
const LINE_MAX = 2

export function TeleprompterView() {
  const script = useTeleprompterStore(selectScript)
  const segments = useTeleprompterStore(selectSegments)
  const playback = useTeleprompterStore(selectPlayback)
  const preferences = useTeleprompterStore(selectPreferences)
  const activeSegment = useTeleprompterStore(selectActiveSegment)

  const setPreferences = useTeleprompterStore((state) => state.setPreferences)
  const togglePlay = useTeleprompterStore((state) => state.togglePlay)
  const nudgeSpeed = useTeleprompterStore((state) => state.nudgeSpeed)
  const jumpToSegment = useTeleprompterStore((state) => state.jumpToSegment)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  useAutoscroll({
    containerRef: scrollContainerRef,
    isPlaying: playback.isPlaying,
    speedMultiplier: playback.speedMultiplier,
  })
  usePrompterHotkeys()

  useEffect(() => {
    const themeClass = `theme-${preferences.theme}`
    document.body.classList.remove(
      'theme-default',
      'theme-dark',
      'theme-light',
      'theme-high-contrast',
    )
    document.body.classList.add(themeClass)
    return () => {
      document.body.classList.remove(themeClass)
    }
  }, [preferences.theme])

  const scriptPaneStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${preferences.fontSizeScale}rem`,
      lineHeight: preferences.lineHeightScale,
      fontFamily: preferences.dyslexicFontEnabled
        ? `'Atkinson Hyperlegible', 'Inter', 'Segoe UI', system-ui, sans-serif`
        : undefined,
    }),
    [preferences],
  )

  return (
    <main className="app-shell">
      <section
        className="script-pane"
        aria-label="Script preview"
        style={scriptPaneStyle}
        data-mirror-x={preferences.mirroredX}
        data-mirror-y={preferences.mirroredY}
      >
        <header className="pane-header">
          <p className="eyebrow">Teleprompter Preview</p>
          <h1>{script.metadata.title}</h1>
          <p className="lede">
            Use the live controls to rehearse scroll pacing, typography, and keyboard
            shortcuts before we wire in show-ready scripts.
          </p>
        </header>

        <div
          className="script-scroll"
          ref={scrollContainerRef}
          role="region"
          aria-label="Scrollable script content"
          tabIndex={0}
        >
          <ol className="segment-list">
            {segments.map((segment) => (
              <li
                key={segment.id}
                className={`segment-card${
                  segment.id === activeSegment?.id ? ' segment-card--active' : ''
                }`}
              >
                <p className="segment-label">{segment.title}</p>
                <p className="segment-script">{segment.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="control-pane" aria-label="Presenter controls">
        <header>
          <p className="eyebrow">Presenter controls</p>
          <h2>Playback & styling</h2>
          <p className="lede">
            Start/pause with the spacebar, nudge speed with arrow keys, or jump between
            segments using J / K.
          </p>
        </header>

        <dl className="status-grid">
          <div>
            <dt>Scroll speed</dt>
            <dd>{playback.speedMultiplier.toFixed(2)}x</dd>
          </div>
          <div>
            <dt>Active segment</dt>
            <dd>{activeSegment?.title ?? '—'}</dd>
          </div>
          <div>
            <dt>Timer</dt>
            <dd>{playback.isPlaying ? 'Running' : 'Paused'}</dd>
          </div>
        </dl>

        <section className="control-buttons" aria-label="Scroll controls">
          <div className="button-row">
            <button type="button" onClick={() => togglePlay()}>
              {playback.isPlaying ? 'Pause scroll' : 'Start scroll'}
            </button>
            <div className="speed-group" aria-label="Speed adjustments">
              <button type="button" onClick={() => nudgeSpeed(-SPEED_STEP)}>
                - Speed
              </button>
              <button type="button" onClick={() => nudgeSpeed(SPEED_STEP)}>
                + Speed
              </button>
            </div>
          </div>

          <label className="segment-selector">
            Jump to segment
            <select
              value={activeSegment?.id ?? segments[0]?.id ?? ''}
              onChange={(event) => jumpToSegment(event.target.value)}
            >
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.title}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="typography-controls" aria-label="Typography controls">
          <div className="slider-control">
            <label htmlFor="font-size-slider">
              Font size <span>{preferences.fontSizeScale.toFixed(2)}x</span>
            </label>
            <input
              id="font-size-slider"
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={0.05}
              value={preferences.fontSizeScale}
              onChange={(event) =>
                setPreferences({ fontSizeScale: Number(event.currentTarget.value) })
              }
            />
          </div>

          <div className="slider-control">
            <label htmlFor="line-height-slider">
              Line spacing <span>{preferences.lineHeightScale.toFixed(2)}x</span>
            </label>
            <input
              id="line-height-slider"
              type="range"
              min={LINE_MIN}
              max={LINE_MAX}
              step={0.05}
              value={preferences.lineHeightScale}
              onChange={(event) =>
                setPreferences({ lineHeightScale: Number(event.currentTarget.value) })
              }
            />
          </div>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.dyslexicFontEnabled}
              onChange={(event) =>
                setPreferences({ dyslexicFontEnabled: event.currentTarget.checked })
              }
            />
            Dyslexic-friendly font
          </label>
        </section>

        <TimerPanel />

        <ThemeSwitcher />

        <MirrorControls />

        <ScriptManager />

        <SegmentNavigator />

        <NotesEditor />
      </aside>
    </main>
  )
}
