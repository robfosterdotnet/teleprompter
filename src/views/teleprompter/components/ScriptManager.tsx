import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import {
  scriptToMarkdown,
  scriptToJsonString,
  parseMarkdownScript,
  parseJsonScript,
} from '@/utils/scriptFormat'
import { downloadText } from '@/utils/download'

const formatTimestamp = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

const parseScriptFile = (contents: string, filename: string) => {
  const trimmed = contents.trim()
  if (!trimmed) {
    throw new Error('File is empty')
  }
  if (filename.endsWith('.json') || trimmed.startsWith('{')) {
    return parseJsonScript(trimmed)
  }
  return parseMarkdownScript(trimmed)
}

export const ScriptManager = () => {
  const script = useTeleprompterStore((state) => state.script)
  const setScript = useTeleprompterStore((state) => state.setScript)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event
    const file = target.files?.[0]
    if (!file) return

    const processImport = async () => {
      try {
        const text = await file.text()
        const parsed = parseScriptFile(text, file.name.toLowerCase())
        setScript(parsed)
        setImportStatus(`Imported "${parsed.metadata.title}" from ${file.name}`)
      } catch (error) {
        setImportStatus((error as Error).message)
      } finally {
        target.value = ''
      }
    }

    void processImport()
  }

  const handleExportMarkdown = () => {
    const markdown = scriptToMarkdown(script)
    downloadText(`${script.metadata.title || 'script'}.md`, markdown, 'text/markdown')
    setImportStatus('Exported Markdown')
  }

  const handleExportJson = () => {
    downloadText(
      `${script.metadata.title || 'script'}.json`,
      scriptToJsonString(script),
      'application/json',
    )
    setImportStatus('Exported JSON')
  }

  return (
    <section className="script-manager" aria-label="Script management">
      <div className="script-manager__header">
        <div>
          <p className="segment-label">Script autosave</p>
          <p className="script-manager__meta">
            Last edited: {formatTimestamp(script.metadata.lastEditedIso)}
          </p>
        </div>
        <div className="script-manager__actions">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import Markdown/JSON
          </button>
          <button type="button" onClick={handleExportMarkdown}>
            Export Markdown
          </button>
          <button type="button" onClick={handleExportJson}>
            Export JSON
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.json"
          className="sr-only"
          aria-label="Import script file"
          onChange={handleFileChange}
        />
      </div>
      {importStatus && <p className="script-manager__status">{importStatus}</p>}
    </section>
  )
}
