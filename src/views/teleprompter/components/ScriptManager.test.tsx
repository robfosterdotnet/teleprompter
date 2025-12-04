import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScriptManager } from './ScriptManager'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetTeleprompterStore } from '@/test/testUtils'
import {
  parseJsonScript,
  parseMarkdownScript,
  scriptToJsonString,
  scriptToMarkdown,
} from '@/utils/scriptFormat'
import { downloadText } from '@/utils/download'

const parsedJsonDraft = {
  id: 'parsed-json',
  metadata: {
    title: 'Json Draft',
    presenter: 'AI',
    lastEditedIso: new Date('2024-02-01T00:00:00Z').toISOString(),
  },
  segments: [],
}

const parsedMarkdownDraft = {
  id: 'parsed-md',
  metadata: {
    title: 'Markdown Draft',
    presenter: 'AI',
    lastEditedIso: new Date('2024-03-01T00:00:00Z').toISOString(),
  },
  segments: [],
}

vi.mock('@/utils/scriptFormat', () => ({
  scriptToMarkdown: vi.fn(() => '# Title\n\nContent'),
  scriptToJsonString: vi.fn(() => '{"id":"script"}'),
  parseMarkdownScript: vi.fn(() => parsedMarkdownDraft),
  parseJsonScript: vi.fn(() => parsedJsonDraft),
}))

vi.mock('@/utils/download', () => ({
  downloadText: vi.fn(),
}))

const createFileWithText = (contents: string, name: string, type: string) => {
  const file = new File([contents], name, { type })
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(contents),
  })
  return file
}

describe('ScriptManager', () => {
  beforeEach(() => {
    resetTeleprompterStore()
    vi.clearAllMocks()
  })

  it('exports scripts as Markdown and JSON files', async () => {
    const user = userEvent.setup()
    const script = {
      id: 'script-1',
      metadata: {
        title: 'Town Hall',
        presenter: 'MC',
        lastEditedIso: new Date('2024-01-01T12:00:00Z').toISOString(),
      },
      segments: [],
    }

    useTeleprompterStore.setState((state) => ({
      ...state,
      script,
    }))

    render(<ScriptManager />)

    await user.click(screen.getByRole('button', { name: 'Export Markdown' }))
    expect(scriptToMarkdown).toHaveBeenCalledWith(script)
    expect(downloadText).toHaveBeenCalledWith(
      'Town Hall.md',
      '# Title\n\nContent',
      'text/markdown',
    )
    expect(screen.getByText('Exported Markdown')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Export JSON' }))
    expect(scriptToJsonString).toHaveBeenCalledWith(script)
    expect(downloadText).toHaveBeenLastCalledWith(
      'Town Hall.json',
      '{"id":"script"}',
      'application/json',
    )
    expect(screen.getByText('Exported JSON')).toBeInTheDocument()
  })

  it('imports JSON files and updates the teleprompter store', async () => {
    const file = createFileWithText(
      '{"metadata":{"title":"Json Draft"}}',
      'draft.json',
      'application/json',
    )
    render(<ScriptManager />)

    const input = screen.getByLabelText('Import script file')
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(parseJsonScript).toHaveBeenCalled()
      expect(useTeleprompterStore.getState().script.id).toBe(parsedJsonDraft.id)
    })
    expect(screen.getByText(/Imported "Json Draft" from draft\.json/)).toBeInTheDocument()
  })

  it('imports Markdown files and surfaces parser errors', async () => {
    render(<ScriptManager />)
    const input = screen.getByLabelText('Import script file')
    const markdownFile = createFileWithText('# Draft', 'outline.md', 'text/markdown')
    await userEvent.upload(input, markdownFile)

    await waitFor(() => {
      expect(parseMarkdownScript).toHaveBeenCalled()
      expect(useTeleprompterStore.getState().script.id).toBe(parsedMarkdownDraft.id)
    })

    const emptyFile = createFileWithText('   ', 'empty.md', 'text/markdown')
    fireEvent.change(input, { target: { files: [emptyFile] } })
    await waitFor(() => {
      expect(screen.getByText('File is empty')).toBeInTheDocument()
    })
  })
})
