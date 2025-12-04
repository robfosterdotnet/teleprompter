import { useMemo, useRef } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useScriptBuilder } from '@/hooks/useScriptBuilder'
import { draftToScript } from '@/utils/scriptBuilder'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { useScriptLibraryStore } from '@/store/scriptLibraryStore'
import type { ScriptDraft } from '@/types/script'

const toneOptions = [
  { value: 'neutral', label: 'Neutral broadcast' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'formal', label: 'Formal' },
]

const styleOptions = [
  { value: 'news', label: 'News rundown' },
  { value: 'story', label: 'Storytelling' },
  { value: 'interview', label: 'Interview' },
  { value: 'countdown', label: 'Countdown' },
]

export const ScriptBuilderView = () => {
  const {
    sources,
    readySources,
    prompt,
    status,
    progress,
    lastError,
    statusMessage,
    partialContent,
    activeDraft,
    estimatedTokens,
    maxSources,
    ingestFiles,
    removeSource,
    setPrompt,
    buildScript,
    cancelBuild,
    resetBuilder,
    selectDraft,
  } = useScriptBuilder()

  const orderedIds = useScriptLibraryStore((state) => state.orderedIds)
  const draftsById = useScriptLibraryStore((state) => state.drafts)
  const deleteDraft = useScriptLibraryStore((state) => state.deleteDraft)
  const duplicateDraft = useScriptLibraryStore((state) => state.duplicateDraft)
  const setScript = useTeleprompterStore((state) => state.setScript)
  const draftList = useMemo(
    () => orderedIds.map((id) => draftsById[id]).filter(Boolean),
    [orderedIds, draftsById],
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return
    await ingestFiles(fileList)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files.length) {
      await handleFiles(event.dataTransfer.files)
    }
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      await handleFiles(event.target.files)
      event.target.value = ''
    }
  }

  const handleSendToTeleprompter = () => {
    if (!activeDraft) return
    setScript(draftToScript(activeDraft))
  }

  const handleLoadDraft = (draft: ScriptDraft) => {
    selectDraft(draft)
  }

  return (
    <main className="builder-shell" aria-label="AI Script Builder workspace">
      <section className="builder-panel">
        <header className="pane-header">
          <p className="eyebrow">AI workspace</p>
          <h1>AI Script Builder</h1>
          <p className="lede">
            Drop research files, describe the intent, and let Azure GPT-5-nano assemble a
            teleprompter-ready script with an audit trail.
          </p>
        </header>

        <div
          className="dropzone"
          onDrop={(event) => void handleDrop(event)}
          onDragOver={(event) => event.preventDefault()}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              fileInputRef.current?.click()
            }
          }}
        >
          <p className="dropzone__title">
            Drop up to {maxSources} files (PDF, DOCX, PPTX, TXT, MD)
          </p>
          <p className="dropzone__hint">Or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => void handleFileInputChange(event)}
          />
        </div>

        <ul className="source-list">
          {sources.map((source) => (
            <li key={source.id} className="source-list__item">
              <div>
                <p className="source-list__filename">{source.filename}</p>
                <p className="source-list__meta">
                  {source.status === 'ready'
                    ? `${source.charCount} chars`
                    : source.status === 'error'
                      ? (source.errorMessage ?? 'Failed to parse')
                      : 'Parsing…'}
                </p>
              </div>
              <div className="source-list__actions">
                {source.status === 'ready' && (
                  <span className="badge badge--success">Ready</span>
                )}
                {source.status === 'error' && (
                  <span className="badge badge--error">Error</span>
                )}
                <button type="button" onClick={() => removeSource(source.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
          {!sources.length && (
            <li className="source-list__empty">
              No files yet. Drop references to unlock the builder.
            </li>
          )}
        </ul>

        <section className="prompt-form" aria-label="Prompt settings">
          <label>
            Topic
            <input
              type="text"
              value={prompt.topic}
              onChange={(event) => setPrompt({ topic: event.currentTarget.value })}
              placeholder="Q1 webcast kickoff"
            />
          </label>

          <label>
            Guidance
            <textarea
              value={prompt.guidance}
              onChange={(event) => setPrompt({ guidance: event.currentTarget.value })}
              placeholder="Call out new pricing, keep to 3 minutes, CTA is to register for the lab."
              rows={4}
            />
          </label>

          <div className="prompt-form__grid">
            <label>
              Tone
              <select
                value={prompt.tone}
                onChange={(event) =>
                  setPrompt({ tone: event.currentTarget.value as typeof prompt.tone })
                }
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Style
              <select
                value={prompt.style}
                onChange={(event) =>
                  setPrompt({ style: event.currentTarget.value as typeof prompt.style })
                }
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Outline
              <select
                value={prompt.outlinePreference}
                onChange={(event) =>
                  setPrompt({
                    outlinePreference: event.currentTarget
                      .value as typeof prompt.outlinePreference,
                  })
                }
              >
                <option value="tight">Tight beats</option>
                <option value="loose">Loose story arc</option>
              </select>
            </label>
          </div>
        </section>

        <div className="prompt-footer">
          <div>
            <p className="prompt-footer__metric">
              Ready sources: {readySources.length} · Est. tokens: {estimatedTokens}
            </p>
            {statusMessage && <p className="prompt-footer__status">{statusMessage}</p>}
            {lastError && <p className="prompt-footer__error">{lastError}</p>}
          </div>
          <div className="prompt-footer__actions">
            <button type="button" className="ghost-button" onClick={resetBuilder}>
              Reset
            </button>
            {status === 'streaming' ? (
              <button type="button" onClick={cancelBuild}>
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void buildScript()}
                disabled={!prompt.topic.trim()}
              >
                Build script
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="builder-panel builder-panel--output">
        <header className="pane-header">
          <p className="eyebrow">AI Output</p>
          <h2>Draft preview</h2>
        </header>

        <div className="output-status">
          <p>
            Status:{' '}
            {status === 'streaming'
              ? `Streaming (${Math.round(progress * 100)}%)`
              : status}
          </p>
          {activeDraft && (
            <button type="button" onClick={handleSendToTeleprompter}>
              Send to teleprompter
            </button>
          )}
        </div>

        <div className="output-preview" role="region" aria-live="polite">
          {status === 'streaming' && (
            <pre className="output-preview__stream">
              {partialContent || 'Waiting for first tokens…'}
            </pre>
          )}
          {status !== 'streaming' && activeDraft && (
            <article className="draft-preview">
              <h3>{activeDraft.title}</h3>
              <ul>
                {activeDraft.outline.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
              <p>{activeDraft.summary}</p>
            </article>
          )}
          {!activeDraft && status !== 'streaming' && (
            <p className="output-preview__placeholder">
              Generate a draft to see it here, then push to the teleprompter when ready.
            </p>
          )}
        </div>

        <section className="library-drawer">
          <header>
            <h3>Script library</h3>
            <p>{draftList.length} saved</p>
          </header>
          <ul>
            {draftList.map((draft) => (
              <li key={draft.id}>
                <div>
                  <p className="library-drawer__title">{draft.title}</p>
                  <p className="library-drawer__meta">
                    {new Date(draft.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="library-drawer__actions">
                  <button type="button" onClick={() => handleLoadDraft(draft)}>
                    Open
                  </button>
                  <button type="button" onClick={() => duplicateDraft(draft.id)}>
                    Duplicate
                  </button>
                  <button type="button" onClick={() => deleteDraft(draft.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {!draftList.length && <li>No saved drafts yet.</li>}
          </ul>
        </section>
      </aside>
    </main>
  )
}
