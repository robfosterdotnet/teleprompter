export type SegmentId = string

export interface Segment {
  id: SegmentId
  title: string
  body: string
  notes?: string
  targetDurationSeconds?: number
}

export interface ScriptMetadata {
  title: string
  presenter?: string
  lastEditedIso: string
}

export interface Script {
  id: string
  metadata: ScriptMetadata
  segments: Segment[]
}

export type ScriptSourceStatus = 'pending' | 'parsing' | 'ready' | 'error'

export interface ScriptSource {
  id: string
  filename: string
  mimeType: string
  charCount: number
  preview: string
  content: string
  status: ScriptSourceStatus
  errorMessage?: string
}

export interface ScriptModelConfig {
  model: string
  temperature?: number
  maxTokens?: number
  tone?: string
  style?: string
  outlinePreference?: string
}

export interface ScriptDraft {
  id: string
  title: string
  outline: string[]
  content: string
  createdAt: string
  updatedAt: string
  summary?: string
  sources: ScriptSource[]
  modelConfig: ScriptModelConfig
  usage?: {
    inputTokens?: number
    outputTokens?: number
    costUsd?: number
  }
  auditTrail?: ScriptDraftAudit
}

export interface ScriptDraftAudit {
  requestId?: string
  generatedBy?: string
  sourceFileNames: string[]
  warnings?: string[]
}
