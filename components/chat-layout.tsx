"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import ChatInterface from "@/components/chat-interface"
import type { Conversation } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

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
  }

  const updateConversation = (conversationId: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : conv,
      ),
    )
  }

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
    if (activeConversationId === conversationId) {
      setActiveConversationId(null)
    }
  }

  const activeConversation = conversations.find((conv) => conv.id === activeConversationId)

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />
      <div className="flex-1 flex flex-col">
        <ChatInterface
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onNewConversation={createNewConversation}
        />
      </div>
    </div>
  )
}
