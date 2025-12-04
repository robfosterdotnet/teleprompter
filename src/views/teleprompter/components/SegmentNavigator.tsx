import { selectSegments, useTeleprompterStore } from '@/store/teleprompterStore'

export const SegmentNavigator = () => {
  const segments = useTeleprompterStore(selectSegments)
  const activeSegmentId = useTeleprompterStore((state) => state.playback.activeSegmentId)
  const jumpToSegment = useTeleprompterStore((state) => state.jumpToSegment)

  return (
    <section className="segment-navigator" aria-label="Segment navigator">
      <h3>Segment list</h3>
      <ol>
        {segments.map((segment, index) => (
          <li key={segment.id}>
            <button
              type="button"
              onClick={() => jumpToSegment(segment.id)}
              aria-current={segment.id === activeSegmentId}
            >
              <span className="segment-index">{index + 1}</span>
              <span>{segment.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
