"use client"

import { useState } from "react"
import type { Message } from "@/lib/types"

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const addMessage = (role: "user" | "assistant" | "system", content: string, pending = false) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      pending,
    }

    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)))
  }

  const clearMessages = () => {
    setMessages([])
  }

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    clearMessages,
    isGenerating,
    setIsGenerating,
  }
}
