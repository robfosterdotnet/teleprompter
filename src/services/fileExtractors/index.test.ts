import { describe, expect, it } from 'vitest'
import { extractPlainText } from './index'

describe('extractPlainText', () => {
  it('returns normalized content for plain text files', async () => {
    const file = new File(['Hello\n\nWorld'], 'sample.txt', { type: 'text/plain' })
    const source = await extractPlainText(file)
    if (source.status !== 'ready') {
      throw new Error(source.errorMessage ?? 'Extraction failed')
    }
    expect(source.status).toBe('ready')
    expect(source.preview).toContain('Hello')
    expect(source.content).toContain('World')
  })
})
