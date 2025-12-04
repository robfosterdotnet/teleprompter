import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractPlainText } from './index'

vi.mock('marked', () => ({
  marked: {
    lexer: vi.fn((raw: string) => [
      { text: raw.split('\n')[0] },
      { tokens: [{ text: 'Line two' }] },
    ]),
  },
}))

const createFileWithText = (contents: string, name: string, type = 'text/plain') => {
  const file = new File([contents], name, { type })
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(contents),
  })
  return file
}

describe('extractPlainText', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns normalized content for plain text files', async () => {
    const file = createFileWithText('Hello\n\nWorld', 'sample.txt')
    const source = await extractPlainText(file)
    if (source.status !== 'ready') {
      throw new Error(source.errorMessage ?? 'Extraction failed')
    }
    expect(source.status).toBe('ready')
    expect(source.preview).toContain('Hello')
    expect(source.content).toContain('World')
  })

  it('rejects files that exceed the upload limit', async () => {
    const bigFile = createFileWithText('content', 'large.txt')
    Object.defineProperty(bigFile, 'size', { value: 10 * 1024 * 1024 + 1 })
    await expect(extractPlainText(bigFile)).rejects.toThrow(
      'File exceeds the 10 MB upload limit',
    )
  })

  it('parses markdown files via the marked lexer', async () => {
    const file = createFileWithText(
      '# Heading\n\nParagraph',
      'script.md',
      'text/markdown',
    )
    const source = await extractPlainText(file)
    if (source.status !== 'ready') {
      throw new Error(source.errorMessage ?? 'Extraction failed')
    }
    expect(source.content).toContain('# Heading')
    expect(source.preview).toContain('Line two')
  })

  it('surfaces extractor failures as error states', async () => {
    const failingFile = new File(['will fail'], 'broken.txt', { type: 'text/plain' })
    Object.defineProperty(failingFile, 'text', {
      value: () => Promise.reject(new Error('Parser exploded')),
    })
    const source = await extractPlainText(failingFile)
    expect(source.status).toBe('error')
    expect(source.errorMessage).toBe('Parser exploded')
  })

  it('falls back to octet-stream mime types for unknown extensions', async () => {
    const file = createFileWithText('body', 'mystery.custom', '')
    const source = await extractPlainText(file)
    if (source.status !== 'ready') {
      throw new Error(source.errorMessage ?? 'Extraction failed')
    }
    expect(source.mimeType).toBe('application/octet-stream')
  })
})
