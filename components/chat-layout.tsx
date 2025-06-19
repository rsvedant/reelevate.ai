"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import ChatInterface from "@/components/chat-interface"
import type { Conversation } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { Toaster } from "@/components/ui/toaster"

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamingEnabled, setStreamingEnabled] = useState(true)

  const { saveConversation, loadConversations, deleteConversation, clearAllConversations, isReady } = useIndexedDB()

  useEffect(() => {
    const savedStreamingEnabled = localStorage.getItem("streamingEnabled")
    if (savedStreamingEnabled !== null) {
      setStreamingEnabled(JSON.parse(savedStreamingEnabled))
    }
  }, [])

  const handleStreamingChange = (enabled: boolean) => {
    setStreamingEnabled(enabled)
    localStorage.setItem("streamingEnabled", JSON.stringify(enabled))
  }

  useEffect(() => {
    const loadSavedConversations = async () => {
      if (!isReady) {
        console.log("Database not ready yet, waiting...")
        return
      }

      console.log("Database is ready, loading conversations...")
      setIsLoading(true)

      try {
        const savedConversations = await loadConversations()
        console.log("Loaded conversations:", savedConversations)

        if (savedConversations && savedConversations.length > 0) {
          setConversations(savedConversations)
          console.log("Set conversations in state:", savedConversations.length)
        } else {
          console.log("No saved conversations found")
        }
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedConversations()
  }, [isReady, loadConversations])

  const createNewConversation = async () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log("Creating new conversation:", newConversation.id)
    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)

    try {
      await saveConversation(newConversation)
      console.log("New conversation saved to IndexedDB")
    } catch (error) {
      console.error("Error saving new conversation:", error)
    }
  }

  const generateConversationTitle = (firstUserMessage: string, firstAiResponse: string) => {
    // Use the first user message to generate a title, but make it more concise
    const userMessageWords = firstUserMessage.trim().split(" ")
    if (userMessageWords.length <= 6) {
      return firstUserMessage
    }
    return userMessageWords.slice(0, 6).join(" ") + "..."
  }

  const updateConversation = async (conversationId: string, updates: Partial<Conversation>) => {
    console.log("Updating conversation:", conversationId, updates)

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === conversationId) {
        const updatedConv = {
          ...conv,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        if (updates.messages && updates.messages.length >= 2 && conv.title === "New Conversation") {
          const userMessage = updates.messages.find((m) => m.role === "user")
          const aiMessage = updates.messages.find((m) => m.role === "assistant" && !m.pending)

          if (userMessage && aiMessage) {
            updatedConv.title = generateConversationTitle(userMessage.content, aiMessage.content)
          }
        }

        return updatedConv
      }
      return conv
    })

    setConversations(updatedConversations)

    const updatedConversation = updatedConversations.find((conv) => conv.id === conversationId)
    if (updatedConversation) {
      try {
        await saveConversation(updatedConversation)
        console.log("Conversation updated in IndexedDB")
      } catch (error) {
        console.error("Error saving conversation:", error)
      }
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
      }
      console.log("Conversation deleted:", conversationId)
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const handleClearAllConversations = async () => {
    try {
      await clearAllConversations()
      setConversations([])
      setActiveConversationId(null)
      console.log("All conversations cleared")
    } catch (error) {
      console.error("Error clearing conversations:", error)
    }
  }

  const activeConversation = conversations.find((conv) => conv.id === activeConversationId)

  if (isLoading) {
    return (
      <div className="flex h-screen bg-zinc-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-zinc-400">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
        setConversations={setConversations}
        setActiveConversationId={setActiveConversationId}
        onClearAllConversations={handleClearAllConversations}
        streamingEnabled={streamingEnabled}
        onStreamingChange={handleStreamingChange}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onNewConversation={createNewConversation}
          streamingEnabled={streamingEnabled}
        />
      </div>
      <Toaster />
    </div>
  )
}
