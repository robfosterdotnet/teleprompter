import { useEffect } from 'react'
import { selectSegments, useTeleprompterStore } from '@/store/teleprompterStore'

const SPEED_STEP = 0.1

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

export const usePrompterHotkeys = () => {
  const togglePlay = useTeleprompterStore((state) => state.togglePlay)
  const nudgeSpeed = useTeleprompterStore((state) => state.nudgeSpeed)
  const jumpToNextSegment = useTeleprompterStore((state) => state.jumpToNextSegment)
  const jumpToPreviousSegment = useTeleprompterStore(
    (state) => state.jumpToPreviousSegment,
  )
  const jumpToSegment = useTeleprompterStore((state) => state.jumpToSegment)
  const segments = useTeleprompterStore(selectSegments)

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      switch (event.key) {
        case ' ':
          event.preventDefault()
          togglePlay()
          break
        case 'ArrowUp':
        case '+':
        case '=':
          event.preventDefault()
          nudgeSpeed(SPEED_STEP)
          break
        case 'ArrowDown':
        case '-':
        case '_':
          event.preventDefault()
          nudgeSpeed(-SPEED_STEP)
          break
        case 'j':
        case 'J':
        case 'PageDown':
          event.preventDefault()
          jumpToNextSegment()
          break
        case 'k':
        case 'K':
        case 'PageUp':
          event.preventDefault()
          jumpToPreviousSegment()
          break
        case 'Home':
          if (segments[0]) {
            event.preventDefault()
            jumpToSegment(segments[0].id)
          }
          break
        case 'End':
          if (segments[segments.length - 1]) {
            event.preventDefault()
            jumpToSegment(segments[segments.length - 1].id)
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [
    togglePlay,
    nudgeSpeed,
    jumpToNextSegment,
    jumpToPreviousSegment,
    jumpToSegment,
    segments,
  ])
}
