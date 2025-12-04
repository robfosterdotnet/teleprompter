import { selectActiveSegment, useTeleprompterStore } from '@/store/teleprompterStore'

export const NotesEditor = () => {
  const activeSegment = useTeleprompterStore(selectActiveSegment)
  const updateNotes = useTeleprompterStore((state) => state.updateSegmentNotes)

  if (!activeSegment) {
    return null
  }

  return (
    <section className="notes-editor" aria-label="Notes lane">
      <header>
        <p className="segment-label">Notes for {activeSegment.title}</p>
      </header>
      <textarea
        value={activeSegment.notes ?? ''}
        placeholder="Add private cues, reminders, or sponsor shout-outs..."
        onChange={(event) => updateNotes(activeSegment.id, event.currentTarget.value)}
      />
    </section>
  )
}
