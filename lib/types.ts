export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  pending?: boolean
  error?: boolean
}

export interface ModelRecord {
  id: string
  name: string
  model: string
  url?: string
  size: string
}

export interface WebLLMModel {
  engine: any
  name: string
  id: string
  chatCompletion: (
    messages: any[],
    options?: {
      temperature?: number
      max_tokens?: number
      stream?: boolean
      callback?: (chunk: string) => void
    },
  ) => Promise<string>
}
