/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/consistent-type-imports */
import type { ScriptSource } from '@/types/script'
import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { marked } from 'marked'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const pdfWorkerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  textNodeName: 'text',
})

const createSourceSkeleton = (file: File): ScriptSource => ({
  id: `source-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
  filename: file.name,
  mimeType: file.type || guessMimeType(file.name),
  charCount: 0,
  preview: '',
  content: '',
  status: 'pending',
})

const guessMimeType = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'md':
    case 'markdown':
    case 'txt':
      return 'text/plain'
    case 'pdf':
      return 'application/pdf'
    case 'doc':
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'ppt':
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    default:
      return 'application/octet-stream'
  }
}

const normalizeText = (input: string) =>
  input
    .replace(/\r\n/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const buildReadySource = (base: ScriptSource, content: string): ScriptSource => {
  const normalized = normalizeText(content)
  return {
    ...base,
    charCount: normalized.length,
    content: normalized,
    preview: normalized.slice(0, 600),
    status: 'ready',
    errorMessage: undefined,
  }
}

const buildErrorSource = (base: ScriptSource, error: unknown): ScriptSource => ({
  ...base,
  status: 'error',
  errorMessage: error instanceof Error ? error.message : 'Failed to process file',
  charCount: 0,
  content: '',
  preview: '',
})

const readFileWithReader = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })

const extractPlainTextFile = async (file: File) => {
  if ('text' in file && typeof file.text === 'function') {
    return file.text()
  }
  try {
    return await readFileWithReader(file)
  } catch {
    // no-op
  }
  if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
    const buffer = await file.arrayBuffer()
    return new TextDecoder().decode(buffer)
  }
  throw new Error('File APIs are unavailable in this environment')
}

const extractMarkdown = async (file: File) => {
  const raw = await file.text()
  const tokens = marked.lexer(raw)
  const flatten = (items: ReturnType<typeof marked.lexer>): string[] =>
    items.flatMap((token) => {
      if ('text' in token && typeof token.text === 'string') {
        return [token.text]
      }
      if ('tokens' in token && Array.isArray(token.tokens)) {
        return flatten(token.tokens as unknown as ReturnType<typeof marked.lexer>)
      }
      if ('items' in token && Array.isArray(token.items)) {
        return flatten(token.items as unknown as ReturnType<typeof marked.lexer>)
      }
      return []
    })
  return flatten(tokens).join('\n')
}

type MammothModule = typeof import('mammoth/mammoth.browser')
let mammothModulePromise: Promise<MammothModule> | null = null

const loadMammoth = () => {
  mammothModulePromise ??= import('mammoth/mammoth.browser')
  return mammothModulePromise
}

const htmlToPlainText = (html: string) => {
  if (typeof window === 'undefined' || !window.DOMParser) {
    return html.replace(/<[^>]+>/g, ' ')
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}

const extractDocxFallback = async (file: File) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const documentXml = await zip.file('word/document.xml')?.async('string')
  if (!documentXml) {
    throw new Error('DOCX archive is missing word/document.xml')
  }
  const parsed = xmlParser.parse(documentXml)
  const paragraphs: unknown[] = parsed?.['w:document']?.['w:body']?.['w:p'] ?? []
  const collectRuns = (run: any): string => {
    if (!run) return ''
    if (Array.isArray(run)) {
      return run.map(collectRuns).join('')
    }
    if (typeof run === 'object' && 'w:t' in run) {
      const text = run['w:t']
      if (typeof text === 'string') return text
      if (text && typeof text === 'object' && 'text' in text) {
        return String(text.text)
      }
    }
    if (typeof run === 'object' && 'text' in run) {
      return String(run.text)
    }
    return ''
  }
  const sections = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map(
    (paragraph) => collectRuns(paragraph?.['w:r'] ?? paragraph),
  )
  return sections.filter(Boolean).join('\n\n')
}

const extractDocx = async (file: File) => {
  try {
    const mammoth = await loadMammoth()
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
    return htmlToPlainText(result.value)
  } catch {
    return extractDocxFallback(file)
  }
}

const extractPptx = async (file: File) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name),
  )
  if (!slideFiles.length) {
    throw new Error('No PPTX slide XML files found')
  }
  const slides: string[] = []
  for (const slideName of slideFiles) {
    const xml = await zip.file(slideName)?.async('string')
    if (!xml) continue
    const parsed = xmlParser.parse(xml)
    const shapes = parsed?.['p:sld']?.['p:cSld']?.['p:spTree'] ?? {}
    const collectText = (node: any): string => {
      if (!node) return ''
      if (Array.isArray(node)) {
        return node.map(collectText).join(' ')
      }
      if (typeof node === 'object') {
        if ('a:t' in node) {
          return Array.isArray(node['a:t'])
            ? node['a:t'].map((value) => String(value?.text ?? value)).join(' ')
            : String(node['a:t']?.text ?? node['a:t'] ?? '')
        }
        return Object.values(node)
          .map((value) => collectText(value))
          .join(' ')
      }
      return typeof node === 'string' ? node : ''
    }
    slides.push(collectText(shapes))
  }
  return slides.filter(Boolean).join('\n\n')
}

const extractPdf = async (file: File) => {
  const [{ getDocument, GlobalWorkerOptions }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
  ])
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const pdf = await getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const textItems = content.items
      .map((item) =>
        'str' in item ? item.str : 'text' in (item as never) ? (item as never).text : '',
      )
      .filter(Boolean)
    pages.push(textItems.join(' '))
  }
  await pdf.destroy()
  return pages.join('\n\n')
}

const selectExtractor = (filename: string, mimeType: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return extractPdf
  }
  if (mimeType.includes('presentation') || extension === 'pptx' || extension === 'ppt') {
    return extractPptx
  }
  if (mimeType.includes('document') || extension === 'docx' || extension === 'doc') {
    return extractDocx
  }
  if (extension === 'md' || extension === 'markdown') {
    return extractMarkdown
  }
  return extractPlainTextFile
}

export async function extractPlainText(file: File): Promise<ScriptSource> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File exceeds the 10 MB upload limit')
  }
  const base = createSourceSkeleton(file)
  const extractor = selectExtractor(file.name, base.mimeType)
  try {
    const content = await extractor(file)
    return buildReadySource(base, content)
  } catch (error) {
    return buildErrorSource(base, error)
  }
}
