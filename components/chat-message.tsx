"use client"

import { useState } from "react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader, Copy, RotateCcw, Trash2, MoreHorizontal, User, Bot, Edit, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

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
        "group flex items-start space-x-3 w-full relative",
        isUser ? "flex-row-reverse space-x-reverse" : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
          isUser ? "bg-white/10" : "bg-zinc-700",
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-zinc-300" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-1 min-w-0 max-w-[calc(100%-5rem)]", isUser ? "flex flex-col items-end" : "")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 break-words hyphens-auto relative",
            "max-w-full overflow-hidden",
            isUser
              ? "bg-white/10 text-white shadow-lg"
              : "bg-zinc-800 text-zinc-100 border border-zinc-700/50",
          )}
          style={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
            maxWidth: "85%",
          }}
        >
          <div className="whitespace-pre-wrap leading-relaxed font-tiempos">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                code({ node, inline, className, children, ...props }: any) {
                  const [isCopied, setIsCopied] = useState(false)
                  const match = /language-(\w+)/.exec(className || "")

                  const handleCopy = () => {
                    if (isCopied) return
                    navigator.clipboard.writeText(String(children)).then(() => {
                      setIsCopied(true)
                      setTimeout(() => setIsCopied(false), 2000)
                    })
                  }

                  return !inline && match ? (
                    <div className="relative my-4 rounded-md bg-zinc-900/70 border border-zinc-700/50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700/50">
                        <span className="text-xs font-sans text-zinc-400">{match[1]}</span>
                        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
                          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <pre className="p-4 whitespace-pre-wrap break-all">
                        <code className={cn("font-mono text-sm", className)} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="px-1 py-0.5 rounded-md bg-zinc-700/50 text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {message.pending && (
            <div className="flex items-center mt-3 text-zinc-400">
              <Loader className="h-3 w-3 animate-spin mr-2" />
              <span className="text-xs">Thinking...</span>
            </div>
          )}
          {!isUser && message.runtimeStats && (
            <div className="mt-3 border-t border-zinc-700/50 pt-2 text-xs text-zinc-400 font-mono">
              <pre className="whitespace-pre-wrap">{message.runtimeStats}</pre>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn("text-xs text-zinc-500 px-1 pt-1", isUser ? "text-right" : "text-left")}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Message Actions - Positioned outside the message bubble */}
      {!message.pending && (
        <div
          className={cn(
            "flex items-center transition-opacity duration-200 mt-1",
            isUser ? "order-first mr-2" : "ml-2",
            isHovered || isDropdownOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 ml-2 hover:bg-zinc-700/50 rounded-full border border-zinc-600/30"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isUser ? "start" : "end"} className="w-48">
              <DropdownMenuItem onClick={() => onAction("copy")}>
                <Copy className="w-4 h-4 mr-2" />
                Copy message
              </DropdownMenuItem>

              {isUser && (
                <DropdownMenuItem onClick={() => onAction("edit")}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit message
                </DropdownMenuItem>
              )}

              {!isUser && (
                <DropdownMenuItem onClick={() => onAction("regenerate")}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate response
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
  )
}
