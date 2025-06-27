"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loader, Copy, RotateCcw, Trash2, MoreHorizontal, User, Bot, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import "katex/dist/katex.min.css"
import { BlockMath, InlineMath } from "react-katex"

interface ChatMessageProps {
  message: Message
  onAction: (action: string) => void
}

export default function ChatMessage({ message, onAction }: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([])
  const isUser = message.role === "user"
  const isSystem = message.system

  useEffect(() => {
    if (message.content && !isSystem) {
      setProcessedContent(renderContentWithLaTeX(message.content))
    }
  }, [message.content, isSystem])

  const renderContentWithLaTeX = (content: string) => {
    if (!content) return []
    // Use 'g' flag only (without 's' flag) for compatibility with older TypeScript targets
    const blockRegex = /\\\[([\s\S]*?)\\\]/g
    const inlineRegex = /\\\(([\s\S]*?)\\\)/g

    let lastIndex = 0
    const parts: React.ReactNode[] = []
    let match
    let contentCopy = content

    // Replace block math
    while ((match = blockRegex.exec(contentCopy)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <ReactMarkdown
            key={`text-${lastIndex}`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ node, ...props }) => <pre className="p-2 rounded bg-muted/80 overflow-auto" {...props} />,
              code: ({ node, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                return match ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                )
              },
              a: ({ node, ...props }) => (
                <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {contentCopy.slice(lastIndex, match.index)}
          </ReactMarkdown>,
        )
      }

      // Add the LaTeX block
      try {
        parts.push(<BlockMath key={`math-${match.index}`} math={match[1]} />)
      } catch (error) {
        parts.push(
          <div key={`math-error-${match.index}`} className="text-red-500">
            {match[0]}
          </div>,
        )
      }

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < contentCopy.length) {
      let remainingContent = contentCopy.slice(lastIndex)

      lastIndex = 0
      const inlineParts: React.ReactNode[] = []

      while ((match = inlineRegex.exec(remainingContent)) !== null) {
        if (match.index > lastIndex) {
          inlineParts.push(
            <ReactMarkdown
              key={`inline-text-${lastIndex}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ node, ...props }) => <pre className="p-2 rounded bg-muted/80 overflow-auto" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "")
                  return match ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="bg-muted/50 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                  )
                },
                a: ({ node, ...props }) => (
                  <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
              }}
            >
              {remainingContent.slice(lastIndex, match.index)}
            </ReactMarkdown>,
          )
        }

        try {
          inlineParts.push(<InlineMath key={`inline-math-${match.index}`} math={match[1]} />)
        } catch (error) {
          inlineParts.push(
            <span key={`inline-math-error-${match.index}`} className="text-red-500">
              {match[0]}
            </span>,
          )
        }

        lastIndex = match.index + match[0].length
      }

      if (lastIndex < remainingContent.length) {
        inlineParts.push(
          <ReactMarkdown
            key={`inline-text-final`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ node, ...props }) => <pre className="p-2 rounded bg-muted/80 overflow-auto" {...props} />,
              code: ({ node, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                return match ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                )
              },
              a: ({ node, ...props }) => (
                <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {remainingContent.slice(lastIndex)}
          </ReactMarkdown>,
        )
      }

      if (inlineParts.length > 0) {
        parts.push(...inlineParts)
      } else {
        parts.push(
          <ReactMarkdown
            key={`text-final`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ node, ...props }) => <pre className="p-2 rounded bg-muted/80 overflow-auto" {...props} />,
              code: ({ node, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                return match ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                )
              },
              a: ({ node, ...props }) => (
                <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {remainingContent}
          </ReactMarkdown>,
        )
      }
    }

    return parts
  }

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
          <div className="whitespace-pre-wrap leading-relaxed font-tiempos">{isSystem ? message.content : processedContent}</div>
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
