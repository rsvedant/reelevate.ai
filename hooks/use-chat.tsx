"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/lib/types"
import { useIndexedDB } from "@/hooks/use-indexed-db"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { saveMessages, loadMessages, clearAllMessages } = useIndexedDB()

  // Load messages from IndexedDB on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const savedMessages = await loadMessages()
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages)
        }
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    fetchMessages()
  }, [loadMessages])

  // Save messages to IndexedDB whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages).catch((error) => {
        console.error("Error saving messages:", error)
      })
    }
  }, [messages, saveMessages])

  const clearMessages = async () => {
    try {
      await clearAllMessages()
      setMessages([])
    } catch (error) {
      console.error("Error clearing messages:", error)
    }
  }

  return {
    messages,
    setMessages,
    clearMessages,
    isGenerating,
    setIsGenerating,
  }
}
