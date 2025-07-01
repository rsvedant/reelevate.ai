export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  pending?: boolean
  error?: boolean
  system?: boolean
  runtimeStats?: string
  thinking?: string
  isThinking?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface ModelRecord {
  id: string
  name: string
  provider: string
  model: string
  lib?: string
  family: string
  recommended_config?: {
    temperature: number,
    presence_penalty?: number,
    frequency_penalty?: number,
    top_p: number
  }
  icon: string
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
      onCompletion?: (stats: { runtimeStats: string }) => void
    },
  ) => Promise<string>
}
