import type { Script, SegmentId } from '@/types/script'

export type ThemeName = 'light' | 'dark' | 'high-contrast'

export interface TeleprompterPreferences {
  theme: ThemeName
  fontSizeScale: number
  lineHeightScale: number
  dyslexicFontEnabled: boolean
  mirroredX: boolean
  mirroredY: boolean
}

export interface PlaybackState {
  isPlaying: boolean
  speedMultiplier: number
  activeSegmentId: SegmentId
}

export interface TeleprompterState {
  script: Script
  playback: PlaybackState
  preferences: TeleprompterPreferences
}

export interface StoredTeleprompterState {
  version: number
  state: TeleprompterState
}
