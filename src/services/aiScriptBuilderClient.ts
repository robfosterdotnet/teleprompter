import type {
  ScriptBuilderRequest,
  ScriptBuilderResponse,
  ScriptBuilderStreamEvent,
} from '@/types/scriptBuilder'

interface GenerateScriptOptions {
  signal?: AbortSignal
  onEvent?: (event: ScriptBuilderStreamEvent) => void
}

const SSE_DELIMITER = '\n\n'

const parseEvent = (chunk: string): ScriptBuilderStreamEvent | null => {
  const trimmed = chunk.trim()
  if (!trimmed.startsWith('data:')) return null
  const payload = trimmed.replace(/^data:\s?/, '')
  try {
    return JSON.parse(payload) as ScriptBuilderStreamEvent
  } catch {
    return null
  }
}

const readStream = async (
  response: Response,
  handler?: (event: ScriptBuilderStreamEvent) => void,
) => {
  if (!response.body) {
    throw new Error('Missing stream body')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: ScriptBuilderResponse | null = null
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split(SSE_DELIMITER)
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const event = parseEvent(part)
      if (!event) continue
      handler?.(event)
      if (event.type === 'complete') {
        result = { draft: event.draft, usage: event.usage, requestId: event.requestId }
      } else if (event.type === 'error') {
        throw new Error(event.message)
      }
    }
  }
  return result
}

interface ErrorPayload {
  error?: {
    message?: string
  }
}

const hasErrorMessage = (value: unknown): value is ErrorPayload =>
  typeof value === 'object' && value !== null && 'error' in value

const normalizeError = async (response: Response) => {
  try {
    const payload: unknown = await response.json()
    if (hasErrorMessage(payload) && typeof payload.error?.message === 'string') {
      throw new Error(payload.error.message)
    }
  } catch {
    // fall through
  }
  throw new Error(`Request failed with status ${response.status}`)
}

export async function generateScript(
  payload: ScriptBuilderRequest,
  options: GenerateScriptOptions = {},
): Promise<ScriptBuilderResponse> {
  const response = await fetch('/.netlify/functions/ai-script-builder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
    await normalizeError(response)
  }

  const result = await readStream(response, options.onEvent)
  if (!result) {
    throw new Error('Generation stream ended without a payload')
  }
  return result
}
