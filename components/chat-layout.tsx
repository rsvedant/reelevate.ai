"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import ChatInterface from "@/components/chat-interface"
import type { Conversation } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { useIndexedDB } from "@/hooks/use-indexed-db"

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { saveConversation, loadConversations, deleteConversation, clearAllConversations } = useIndexedDB()

  // Load conversations from IndexedDB on mount
  useEffect(() => {
    const loadSavedConversations = async () => {
      try {
        const savedConversations = await loadConversations()
        if (savedConversations && savedConversations.length > 0) {
          setConversations(savedConversations)
          // Optionally set the most recent conversation as active
          // setActiveConversationId(savedConversations[0].id)
        }
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedConversations()
  }, [loadConversations])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)

    // Save to IndexedDB
    saveConversation(newConversation).catch((error) => {
      console.error("Error saving new conversation:", error)
    })
  }

  const updateConversation = async (conversationId: string, updates: Partial<Conversation>) => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : conv,
    )

    setConversations(updatedConversations)

    // Save updated conversation to IndexedDB
    const updatedConversation = updatedConversations.find((conv) => conv.id === conversationId)
    if (updatedConversation) {
      try {
        await saveConversation(updatedConversation)
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
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const handleClearAllConversations = async () => {
    try {
      await clearAllConversations()
      setConversations([])
      setActiveConversationId(null)
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
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onNewConversation={createNewConversation}
        />
      </div>
    </div>
  )
}
