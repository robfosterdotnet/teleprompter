import type { Script, Segment } from '@/types/teleprompter'

const sanitizeId = (title: string, index: number) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `segment-${index}`

const normalizeSegment = (segment: Segment, index: number): Segment => ({
  id: segment.id ?? sanitizeId(segment.title, index),
  title: segment.title.trim() || `Segment ${index + 1}`,
  body: segment.body.trim(),
  notes: segment.notes,
  targetDurationSeconds: segment.targetDurationSeconds,
})

const stampScript = (script: Script): Script => ({
  ...script,
  metadata: {
    ...script.metadata,
    lastEditedIso: new Date().toISOString(),
  },
  segments: script.segments.map((segment, index) => normalizeSegment(segment, index)),
})

export const parseMarkdownScript = (markdown: string): Script => {
  const lines = markdown.split(/\r?\n/)
  let metadataTitle = 'Imported Script'
  const segments: { title: string; lines: string[] }[] = []
  let currentSegment: { title: string; lines: string[] } | null = null

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (line.startsWith('# ')) {
      metadataTitle = trimmed.replace(/^#\s*/, '').trim() || metadataTitle
      return
    }

    if (line.startsWith('## ')) {
      if (currentSegment) {
        segments.push(currentSegment)
      }
      currentSegment = { title: line.replace(/^##\s*/, '').trim(), lines: [] }
      return
    }

    if (!currentSegment) {
      if (trimmed === '') {
        return
      }
      currentSegment = { title: 'Opening Segment', lines: [] }
    }
    currentSegment.lines.push(line)
  })

  if (currentSegment) {
    segments.push(currentSegment)
  }

  if (segments.length === 0) {
    segments.push({
      title: 'Imported Segment',
      lines,
    })
  }

  const normalizedSegments: Segment[] = segments.map((segment, index) => ({
    id: sanitizeId(segment.title, index),
    title: segment.title,
    body: segment.lines.join('\n').trim(),
  }))

  return stampScript({
    id: `imported-${Date.now()}`,
    metadata: {
      title: metadataTitle,
      presenter: undefined,
      lastEditedIso: new Date().toISOString(),
    },
    segments: normalizedSegments,
  })
}

export const parseJsonScript = (jsonText: string): Script => {
  const raw = JSON.parse(jsonText) as Script
  return stampScript(raw)
}

export const scriptToMarkdown = (script: Script): string => {
  const lines: string[] = [`# ${script.metadata.title}`, '']
  script.segments.forEach((segment) => {
    lines.push(`## ${segment.title}`, segment.body.trim(), '')
  })
  return lines.join('\n').trim() + '\n'
}

export const scriptToJsonString = (script: Script): string =>
  JSON.stringify(script, null, 2)
