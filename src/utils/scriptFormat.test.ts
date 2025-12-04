import { describe, expect, it } from 'vitest'
import { SAMPLE_SCRIPT } from '@/data/sampleScript'
import {
  parseJsonScript,
  parseMarkdownScript,
  scriptToJsonString,
  scriptToMarkdown,
} from './scriptFormat'

describe('scriptFormat helpers', () => {
  it('round-trips markdown serialization', () => {
    const markdown = scriptToMarkdown(SAMPLE_SCRIPT)
    const parsed = parseMarkdownScript(markdown)

    expect(parsed.metadata.title).toBe(SAMPLE_SCRIPT.metadata.title)
    expect(parsed.segments.length).toBe(SAMPLE_SCRIPT.segments.length)
  })

  it('generates stable JSON output', () => {
    const json = scriptToJsonString(SAMPLE_SCRIPT)
    const parsed = parseJsonScript(json)

    expect(parsed.metadata.title).toBe(SAMPLE_SCRIPT.metadata.title)
    expect(parsed.segments[0].title).toBe(SAMPLE_SCRIPT.segments[0].title)
  })
})
