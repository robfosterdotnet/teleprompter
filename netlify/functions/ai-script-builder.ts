import { stream } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { AzureOpenAI } from 'openai'
import type { ScriptDraft, ScriptSource } from '@/types/script'
import type {
  ScriptBuilderPrompt,
  ScriptBuilderRequest,
  ScriptBuilderStreamEvent,
} from '@/types/scriptBuilder'

const API_VERSION_DEFAULT = '2025-03-01-preview'
const {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_API_VERSION = API_VERSION_DEFAULT,
  AZURE_OPENAI_DEPLOYMENT,
} = process.env

const REQUIRED_ENV = [
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_DEPLOYMENT',
]

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key])
if (missingEnv.length) {
  console.warn(
    `[ai-script-builder] Missing env vars: ${missingEnv.join(
      ', ',
    )}. Requests will fail until they are configured.`,
  )
}

const client =
  AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY
    ? new AzureOpenAI({
        apiKey: AZURE_OPENAI_API_KEY,
        endpoint: AZURE_OPENAI_ENDPOINT,
        apiVersion: AZURE_OPENAI_API_VERSION,
        deployment: AZURE_OPENAI_DEPLOYMENT,
      })
    : null

const SOURCE_CHAR_LIMIT = 4000

interface CompletionResponse {
  id: string
  output_text?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

const validateRequest = (payload: unknown): ScriptBuilderRequest => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is empty or invalid JSON')
  }
  const candidate = payload as Partial<ScriptBuilderRequest>
  if (!candidate.topic?.trim()) {
    throw new Error('Topic is required')
  }
  const rawSources = Array.isArray(candidate.sources) ? candidate.sources : []
  const sanitizedSources = rawSources.map((source) => {
    if (!source?.id || !source.text) {
      throw new Error('Source entries must include id and extracted text')
    }
    return {
      id: source.id,
      filename: source.filename ?? 'source.txt',
      mimeType: source.mimeType ?? 'text/plain',
      charCount: source.charCount ?? source.text.length,
      text: source.text.slice(0, SOURCE_CHAR_LIMIT),
    }
  })
  return {
    topic: candidate.topic,
    guidance: candidate.guidance ?? '',
    tone: candidate.tone ?? 'neutral',
    style: candidate.style ?? 'news',
    outlinePreference: candidate.outlinePreference ?? 'tight',
    sources: sanitizedSources,
    previousScriptId: candidate.previousScriptId,
  }
}

const SYSTEM_PROMPT = `
You are an AI script writer helping webcast hosts produce polished teleprompter copy.
Return concise, high-energy narration following the requested tone/style while respecting timing.
Output JSON matching:
{
  "title": string,
  "hook": string,
  "outline": string[],
  "sections": [
    { "heading": string, "body": string }
  ],
  "cta": string,
  "summary": string
}
Do not include backticks or commentary—JSON only.
`

const buildUserPrompt = (payload: ScriptBuilderRequest) => {
  const hasSources = payload.sources.length > 0
  const sourceDescriptions = hasSources
    ? payload.sources
        .map(
          (source, index) =>
            `Source ${index + 1}: ${source.filename}\n---\n${source.text}\n---`,
        )
        .join('\n\n')
    : 'No supporting files were provided—lean on the topic + guidance only.'
  return `
Topic: ${payload.topic}
Tone: ${payload.tone}
Style: ${payload.style}
Outline preference: ${payload.outlinePreference}
Additional guidance: ${payload.guidance || 'n/a'}

Use the following reference material:
${sourceDescriptions}

Return JSON per the schema.
`
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getValue = (record: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined

const toSections = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null
      }
      const heading =
        'heading' in entry && typeof entry.heading === 'string'
          ? entry.heading
          : 'Segment'
      const body = 'body' in entry && typeof entry.body === 'string' ? entry.body : ''
      return { heading, body }
    })
    .filter((section): section is { heading: string; body: string } => Boolean(section))
}

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined)

const parseCompletionUsage = (value: unknown): CompletionResponse['usage'] => {
  if (!isPlainObject(value)) {
    return undefined
  }
  const inputTokens =
    'input_tokens' in value && typeof value.input_tokens === 'number'
      ? value.input_tokens
      : undefined
  const outputTokens =
    'output_tokens' in value && typeof value.output_tokens === 'number'
      ? value.output_tokens
      : undefined
  return (inputTokens ?? outputTokens)
    ? { input_tokens: inputTokens, output_tokens: outputTokens }
    : undefined
}

const normalizeCompletionResponse = (value: unknown): CompletionResponse => {
  if (!isPlainObject(value)) {
    return { id: `completion-${randomUUID()}` }
  }
  const id = typeof value.id === 'string' ? value.id : `completion-${randomUUID()}`
  const outputText = getString(value.output_text)
  const usage = parseCompletionUsage(value.usage)
  return {
    id,
    output_text: outputText,
    usage,
  }
}

const mapResponseToDraft = (
  responsePayload: unknown,
  sources: ScriptSource[],
  prompt: ScriptBuilderPrompt,
  modelName: string,
): ScriptDraft => {
  const parsedInput: unknown =
    typeof responsePayload === 'string' ? JSON.parse(responsePayload) : responsePayload
  const parsedObject: Record<string, unknown> = isPlainObject(parsedInput)
    ? parsedInput
    : {}

  const sectionsInput = getValue(parsedObject, 'sections')
  const sections = toSections(sectionsInput)

  const outlineInput = toStringArray(getValue(parsedObject, 'outline'))
  const outline = outlineInput.length
    ? outlineInput
    : sections.map((section) => section.heading || 'Segment')

  const bodyFallback = getString(getValue(parsedObject, 'body')) ?? ''
  const content =
    sections
      .map((section) => `${section.heading}\n${section.body}`.trim())
      .join('\n\n') || bodyFallback

  const now = new Date().toISOString()
  const titleValue = getString(getValue(parsedObject, 'title'))
  const summaryValue = getString(getValue(parsedObject, 'summary'))

  return {
    id: `draft-${randomUUID()}`,
    title: titleValue ?? prompt.topic,
    outline,
    content,
    createdAt: now,
    updatedAt: now,
    summary: summaryValue,
    sources,
    modelConfig: {
      model: modelName,
      tone: prompt.tone,
      style: prompt.style,
      outlinePreference: prompt.outlinePreference,
    },
    auditTrail: {
      generatedBy: 'ai-script-builder',
      sourceFileNames: sources.map((source) => source.filename),
    },
  }
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

const handler = stream((event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: { message: 'Method not allowed' } }),
    }
  }

  if (!client) {
    return {
      statusCode: 503,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: { message: 'Azure OpenAI is not configured' } }),
    }
  }

  let requestPayload: ScriptBuilderRequest
  try {
    const parsedBody: unknown = event.body ? JSON.parse(event.body) : null
    requestPayload = validateRequest(parsedBody)
  } catch (error) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: { message: (error as Error).message } }),
    }
  }

  const bodyStream = new Readable({
    read() {
      // pushed manually
    },
  })

  const writeEvent = (payload: ScriptBuilderStreamEvent) => {
    bodyStream.push(`data: ${JSON.stringify(payload)}\n\n`)
  }

  ;(async () => {
    writeEvent({ type: 'progress', progress: 0.1, message: 'Preparing prompt' })

    try {
      const completionRaw = await client.responses.create({
        model: AZURE_OPENAI_DEPLOYMENT!,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(requestPayload) },
        ],
      })
      const completion = normalizeCompletionResponse(completionRaw)

      writeEvent({
        type: 'progress',
        progress: 0.7,
        message: 'Polishing script draft',
      })

      const text = completion.output_text ?? ''
      const sources: ScriptSource[] = requestPayload.sources.map((source) => ({
        id: source.id,
        filename: source.filename,
        mimeType: source.mimeType,
        charCount: source.charCount,
        preview: source.text.slice(0, 500),
        content: source.text,
        status: 'ready',
      }))

      const draft = mapResponseToDraft(
        text,
        sources,
        requestPayload,
        AZURE_OPENAI_DEPLOYMENT ?? 'gpt-5-nano',
      )

      writeEvent({
        type: 'complete',
        draft,
        usage: {
          inputTokens: completion?.usage?.input_tokens,
          outputTokens: completion?.usage?.output_tokens,
        },
        requestId: completion.id,
      })
    } catch (error) {
      writeEvent({
        type: 'error',
        message: (error as Error).message ?? 'Failed to build script',
      })
    } finally {
      bodyStream.push(null)
    }
  })().catch((error) => {
    writeEvent({
      type: 'error',
      message: (error as Error).message ?? 'Failed to build script',
    })
    bodyStream.push(null)
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
    body: bodyStream,
  }
})

export { handler }
