"use client"

import { useState } from "react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader, Copy, RotateCcw, Trash2, MoreHorizontal, User, Bot, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatMessageProps {
  message: Message
  onAction: (action: string) => void
}

export default function ChatMessage({ message, onAction }: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isUser = message.role === "user"
  const isSystem = message.system

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md rounded-lg px-3 py-2 bg-zinc-800/50 border border-zinc-700 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-zinc-400">
            <Loader className="h-4 w-4 animate-spin" />
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex items-start space-x-4 w-full relative",
        isUser ? "flex-row-reverse space-x-reverse" : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-purple-500" : "bg-zinc-700",
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-zinc-300" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-2 min-w-0 max-w-[calc(100%-4rem)]", isUser ? "flex flex-col items-end" : "")}>
        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 break-words hyphens-auto relative",
              "max-w-full overflow-hidden",
              isUser ? "bg-purple-500 text-white ml-auto" : "bg-zinc-800 text-zinc-100 mr-auto",
            )}
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: isUser ? "85%" : "85%",
            }}
          >
            <div className="whitespace-pre-wrap pr-8">{message.content}</div>
            {message.pending && (
              <div className="flex items-center mt-2 text-zinc-400">
                <Loader className="h-3 w-3 animate-spin mr-1" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}

            {/* Message Actions - Positioned absolutely within the message bubble */}
            {!message.pending && (
              <div
                className={cn(
                  "absolute top-2 transition-opacity duration-200",
                  isUser ? "left-2" : "right-2",
                  isHovered || isDropdownOpen ? "opacity-100" : "opacity-0",
                )}
              >
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-zinc-700/50 rounded-full">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isUser ? "start" : "end"} className="w-48">
                    <DropdownMenuItem onClick={() => onAction("copy")}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy message
                    </DropdownMenuItem>
                    {!isUser && (
                      <>
                        <DropdownMenuItem onClick={() => onAction("regenerate")}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Regenerate response
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction("edit")}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit and resend
                        </DropdownMenuItem>
                      </>
                    )}
                    {isUser && (
                      <DropdownMenuItem onClick={() => onAction("edit")}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onAction("delete")} className="text-red-400 focus:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className={cn("text-xs text-zinc-500", isUser ? "text-right" : "text-left")}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  )
}
