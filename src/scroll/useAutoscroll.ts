import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface AutoscrollOptions {
  containerRef: RefObject<HTMLElement | null>
  speedMultiplier: number
  isPlaying: boolean
  basePixelsPerSecond?: number
}

const DEFAULT_PIXELS_PER_SECOND = 140

export const useAutoscroll = ({
  containerRef,
  speedMultiplier,
  isPlaying,
  basePixelsPerSecond = DEFAULT_PIXELS_PER_SECOND,
}: AutoscrollOptions) => {
  const animationFrameRef = useRef<number | null>(null)
  const previousTimestampRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isPlaying) {
      return undefined
    }

    const step = (timestamp: number) => {
      previousTimestampRef.current ??= timestamp

      const deltaMs = timestamp - previousTimestampRef.current
      previousTimestampRef.current = timestamp

      const deltaPixels = ((basePixelsPerSecond * speedMultiplier) / 1000) * deltaMs

      const maxScrollTop = container.scrollHeight - container.clientHeight
      const nextScrollTop = Math.min(container.scrollTop + deltaPixels, maxScrollTop)
      container.scrollTop = nextScrollTop

      if (nextScrollTop >= maxScrollTop) {
        animationFrameRef.current = null
        return
      }

      animationFrameRef.current = window.requestAnimationFrame(step)
    }

    animationFrameRef.current = window.requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = null
      previousTimestampRef.current = null
    }
  }, [containerRef, speedMultiplier, isPlaying, basePixelsPerSecond])
}
