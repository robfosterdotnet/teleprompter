import { useEffect, useMemo, useRef, useState } from 'react'
import {
  selectActiveSegment,
  selectPlayback,
  selectScript,
  useTeleprompterStore,
} from '@/store/teleprompterStore'

const WORDS_PER_MINUTE = 140

const getWordCount = (text: string) =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length

const formatMs = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export const usePlaybackTimers = () => {
  const playback = useTeleprompterStore(selectPlayback)
  const script = useTeleprompterStore(selectScript)
  const activeSegment = useTeleprompterStore(selectActiveSegment)
  const [elapsedMs, setElapsedMs] = useState(0)
  const rafRef = useRef<number | null>(null)
  const previousTimestamp = useRef<number | null>(null)

  const totalWords = useMemo(
    () =>
      script.segments.reduce((count, segment) => count + getWordCount(segment.body), 0),
    [script.segments],
  )

  const estimatedTotalMs = useMemo(() => {
    if (totalWords === 0) return 0
    const minutes = totalWords / WORDS_PER_MINUTE
    const baseMs = minutes * 60_000
    return baseMs / Math.max(playback.speedMultiplier, 0.1)
  }, [totalWords, playback.speedMultiplier])

  const etaMs = useMemo(() => {
    if (estimatedTotalMs === 0) return 0
    const activeIndex = script.segments.findIndex(
      (segment) => segment.id === activeSegment?.id,
    )
    const progressRatio = activeIndex >= 0 ? activeIndex / script.segments.length : 0
    const remainingRatio = 1 - progressRatio
    return Math.max(estimatedTotalMs * remainingRatio - elapsedMs, 0)
  }, [estimatedTotalMs, script.segments, activeSegment, elapsedMs])

  useEffect(() => {
    if (!playback.isPlaying) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      previousTimestamp.current = null
      return
    }

    const step = (timestamp: number) => {
      previousTimestamp.current ??= timestamp

      const delta = timestamp - previousTimestamp.current
      previousTimestamp.current = timestamp
      setElapsedMs((current) => current + delta)
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      previousTimestamp.current = null
    }
  }, [playback.isPlaying])

  const resetElapsed = () => setElapsedMs(0)

  return {
    elapsedMs,
    etaMs,
    estimatedTotalMs,
    elapsedLabel: formatMs(elapsedMs),
    etaLabel: formatMs(etaMs),
    totalLabel: formatMs(estimatedTotalMs),
    resetElapsed,
  }
}
