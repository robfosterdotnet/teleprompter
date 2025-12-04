declare module 'mammoth/mammoth.browser' {
  interface ConvertResult {
    value: string
    messages: { type: string; message: string }[]
  }

  export function convertToHtml(options: {
    arrayBuffer: ArrayBuffer
  }): Promise<ConvertResult>
}
