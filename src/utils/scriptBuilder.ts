import type { Script, ScriptDraft } from '@/types/script'

const slugify = (input: string, index: number) =>
  `${input.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`.replace(/^-+|-+$/g, '')

export const draftToScript = (draft: ScriptDraft): Script => {
  const blocks = draft.content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const segments = blocks.map((block, index) => {
    const [maybeHeading, ...rest] = block.split('\n')
    const titleFromOutline = draft.outline[index]
    const title = titleFromOutline || maybeHeading || `Segment ${index + 1}`
    const body =
      rest.length > 0
        ? rest.join('\n').trim()
        : titleFromOutline
          ? block
          : rest.join('\n')
    return {
      id: slugify(draft.id, index) || `segment-${index}`,
      title,
      body: body || maybeHeading || '',
    }
  })

  const now = new Date().toISOString()

  return {
    id: `script-${draft.id}`,
    metadata: {
      title: draft.title || 'AI Draft',
      presenter: 'AI Script Builder',
      lastEditedIso: now,
    },
    segments: segments.length
      ? segments
      : [
          {
            id: `${draft.id}-0`,
            title: draft.title || 'Draft',
            body: draft.content,
          },
        ],
  }
}
