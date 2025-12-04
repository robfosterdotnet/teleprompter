import type { ScriptDraft, ScriptSource } from '@/types/script'

export type ToneOption = 'neutral' | 'conversational' | 'energetic' | 'formal'
export type StyleOption = 'news' | 'story' | 'interview' | 'countdown'

export interface ScriptBuilderPrompt {
  topic: string
  guidance: string
  tone: ToneOption
  style: StyleOption
  outlinePreference: 'tight' | 'loose'
}

type ScriptBuilderSourcePayload = Pick<ScriptSource, 'id' | 'filename' | 'mimeType'> & {
  text: string
  charCount: number
}

export interface ScriptBuilderRequest extends ScriptBuilderPrompt {
  sources: ScriptBuilderSourcePayload[]
  previousScriptId?: string
}

export interface ScriptBuilderResponse {
  draft: ScriptDraft
  usage?: {
    inputTokens?: number
    outputTokens?: number
    costUsd?: number
  }
  requestId?: string
}

export type ScriptBuilderStreamEvent =
  | {
      type: 'progress'
      progress: number
      message?: string
    }
  | {
      type: 'chunk'
      content: string
    }
  | {
      type: 'complete'
      draft: ScriptDraft
      usage?: ScriptBuilderResponse['usage']
      requestId?: string
    }
  | {
      type: 'error'
      message: string
    }
