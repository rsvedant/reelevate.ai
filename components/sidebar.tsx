"use client"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, MoreHorizontal } from "lucide-react"
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
}: SidebarProps) {
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null)

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

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Reelevate.AI</h1>
            <p className="text-xs text-zinc-400">AI Reel Ideas Generator</p>
          </div>
        </div>

        <Button onClick={onNewConversation} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-zinc-800">
        <div className="space-y-2">
          <SettingsDialog
            onClearAllData={onClearAllConversations}
            onExportData={() => {
              // Export conversations as JSON
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
              // Import conversations from JSON file
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
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-lg p-3 cursor-pointer transition-colors",
                    activeConversationId === conversation.id
                      ? "bg-zinc-800 border border-zinc-700"
                      : "hover:bg-zinc-800/50",
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                  onMouseEnter={() => setHoveredConversation(conversation.id)}
                  onMouseLeave={() => setHoveredConversation(null)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-zinc-400">{conversation.messages.length} messages</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">{formatDate(conversation.updatedAt)}</span>
                      </div>
                    </div>

                    {(hoveredConversation === conversation.id || activeConversationId === conversation.id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteConversation(conversation.id)
                            }}
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
