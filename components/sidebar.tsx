"use client"

import type React from "react"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, MoreHorizontal, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import SettingsDialog from "@/components/settings-dialog"

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  setConversations: (conversations: Conversation[]) => void
  setActiveConversationId: (id: string | null) => void
  onClearAllConversations: () => void
  streamingEnabled: boolean
  onStreamingChange: (enabled: boolean) => void
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  setConversations,
  setActiveConversationId,
  onClearAllConversations,
  streamingEnabled,
  onStreamingChange,
}: SidebarProps) {
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null)
  const [editingConversation, setEditingConversation] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const handleEditStart = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConversation(conversation.id)
    setEditTitle(conversation.title)
  }

  const handleEditSave = (conversationId: string) => {
    if (editTitle.trim()) {
      setConversations(
        conversations.map((conv) => (conv.id === conversationId ? { ...conv, title: editTitle.trim() } : conv)),
      )
    }
    setEditingConversation(null)
    setEditTitle("")
  }

  const handleEditCancel = () => {
    setEditingConversation(null)
    setEditTitle("")
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteConversation(conversationId)
  }

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white">Reelevate.AI</h1>
            <p className="text-xs text-zinc-400">AI Reel Ideas Generator</p>
          </div>
        </div>

        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-zinc-800">
        <SettingsDialog
          onClearAllData={onClearAllConversations}
          onExportData={() => {
            const dataStr = JSON.stringify(conversations, null, 2)
            const dataBlob = new Blob([dataStr], { type: "application/json" })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement("a")
            link.href = url
            link.download = "reelevate-conversations.json"
            link.click()
            URL.revokeObjectURL(url)
          }}
          onImportData={(file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              try {
                const importedData = JSON.parse(e.target?.result as string)
                if (Array.isArray(importedData)) {
                  setConversations(importedData)
                }
              } catch (error) {
                console.error("Error importing data:", error)
              }
            }
            reader.readAsText(file)
          }}
          streamingEnabled={streamingEnabled}
          onStreamingChange={onStreamingChange}
        />
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-zinc-500 py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-zinc-600 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-xl p-3 cursor-pointer transition-all duration-200",
                    activeConversationId === conversation.id
                      ? "bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 shadow-lg"
                      : "hover:bg-zinc-800/50 border border-transparent",
                  )}
                  onClick={() => !editingConversation && onSelectConversation(conversation.id)}
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      {editingConversation === conversation.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleEditSave(conversation.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSave(conversation.id)
                            if (e.key === "Escape") handleEditCancel()
                          }}
                          className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="font-medium text-sm truncate text-white leading-relaxed">
                          {conversation.title}
                        </h3>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-zinc-400">{conversation.messages.length} messages</span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{formatDate(conversation.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Always show the dropdown menu button, but with varying opacity */}
                    {editingConversation !== conversation.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 hover:bg-zinc-700/50 rounded-lg transition-opacity duration-200",
                              hoveredConversation === conversation.id || activeConversationId === conversation.id
                                ? "opacity-100"
                                : "opacity-30 hover:opacity-100",
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => handleEditStart(conversation, e)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className="text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
