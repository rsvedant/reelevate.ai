"use client"

import type React from "react"
import { useEffect, useState, useRef, use } from "react"
import { useModel } from "@/hooks/use-model"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import type { Message, Conversation } from "@/lib/types"
import { SYSTEM_PROMPT } from "@/lib/constants"
import { extractThinkingContent } from "@/lib/utils"
import { Loader, Send, ChevronDown, Cpu, Sparkles, Plus, StopCircle, StickyNoteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ChatMessage from "@/components/chat-message"
import ModelSelector from "@/components/model-selector"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface ChatInterfaceProps {
  conversation?: Conversation
  onUpdateConversation: (conversationId: string, updates: Partial<Conversation>) => void
  onNewConversation: () => void
  streamingEnabled: boolean
}

export default function ChatInterface({
  conversation,
  onUpdateConversation,
  onNewConversation,
  streamingEnabled,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    model,
    isModelLoaded,
    isModelLoading,
    progress,
    setError,
    error,
    selectedModelRecord,
    switchModel,
    stop,
  } = useModel()

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      }, 100)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  useEffect(() => {
    if (error) {
      toast({
        title: "🔔",
        description: error,
        variant: "default",
      })
    }
  }, [error])

  const updateMessages = (newMessages: Message[]) => {
    if (conversation) {
      onUpdateConversation(conversation.id, { messages: newMessages })
    }
  }

  const sendMessage = async (content: string) => {
    if (!isModelLoaded || !model || !conversation) {
      console.error("Model not loaded or no active conversation")
      setError("Model not loaded or no active conversation")
      return
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    const aiMessage: Message = {
      id: uuidv4(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      pending: true,
    }

    const newMessages = [...conversation.messages, userMessage, aiMessage]
    updateMessages(newMessages)

    setIsGenerating(true)

    try {
      const conversationHistory = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...conversation.messages
          .filter((msg) => !msg.pending && !msg.error)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        {
          role: "user",
          content,
        },
      ]

      let accumulatedContent = ""
      let messageFinalized = false

      if (streamingEnabled) {
        await model.chatCompletion(conversationHistory, {
          temperature: 0.7,
          max_tokens: 800,
          stream: true,
          callback: (chunk: string) => {
            accumulatedContent += chunk
            const { content, thinking } = extractThinkingContent(accumulatedContent)
            const isCurrentlyThinking = accumulatedContent.includes("<think>")
            const updatedMessages = newMessages.map((msg, index) =>
              index === newMessages.length - 1 && msg.pending
                ? { ...msg, content, thinking, isThinking: isCurrentlyThinking }
                : msg,
            )
            updateMessages(updatedMessages)
          },
          onCompletion: (stats: { runtimeStats: string }) => {
            const { content, thinking } = extractThinkingContent(accumulatedContent)
            const finalMessages = newMessages.map((msg, index) =>
              index === newMessages.length - 1
                ? {
                    ...msg,
                    pending: false,
                    content,
                    thinking,
                    runtimeStats: stats.runtimeStats,
                    isThinking: !!thinking,
                  }
                : msg,
            )
            updateMessages(finalMessages)
            messageFinalized = true
          },
        })
      } else {
        accumulatedContent = await model.chatCompletion(conversationHistory, {
          temperature: 0.7,
          max_tokens: 800,
          stream: false,
        })
      }

      if (!messageFinalized) {
        const { content, thinking } = extractThinkingContent(accumulatedContent)
        const finalMessages = newMessages.map((msg, index) =>
          index === newMessages.length - 1 && msg.pending
            ? { ...msg, pending: false, content, thinking, isThinking: !!thinking }
            : msg,
        )
        updateMessages(finalMessages)
      }
    } catch (error) {
      setError(`Error generating response: ${error}`)
      console.error("Error generating response:", error)

      const errorMessageContent =
        error instanceof Error &&
        (error.message.toLowerCase().includes("interrupted") || error.message.toLowerCase().includes("cancelled"))
          ? "Generation stopped."
          : "Sorry, I encountered an error while generating a response. Please try again."

      const errorMessages = newMessages.map((msg, index) =>
        index === newMessages.length - 1 && msg.pending
          ? {
              ...msg,
              content: errorMessageContent,
              pending: false,
              error: errorMessageContent === "Generation stopped." ? false : true,
            }
          : msg,
      )
      updateMessages(errorMessages)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStop = () => {
    if (isGenerating || isModelLoading) {
      stop()
      if (isGenerating) {
        setIsGenerating(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating || !isModelLoaded) return

    if (!conversation) {
      onNewConversation()
      return
    }

    const userMessage = input.trim()
    setInput("")
    await sendMessage(userMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleModelSwitch = (modelId: string) => {
    switchModel(modelId)
    setShowModelSelector(false)
  }

  const handleMessageAction = (messageId: string, action: string) => {
    if (!conversation) return

    switch (action) {
      case "copy":
        const message = conversation.messages.find((m) => m.id === messageId)
        if (message) {
          navigator.clipboard.writeText(message.content)
        }
        break
      case "delete":
        updateMessages(conversation.messages.filter((m) => m.id !== messageId))
        break
      case "regenerate":
        const messageIndex = conversation.messages.findIndex((m) => m.id === messageId)
        if (messageIndex > 0) {
          const previousUserMessage = conversation.messages[messageIndex - 1]
          if (previousUserMessage.role === "user") {
            const messagesUpToUser = conversation.messages.slice(0, messageIndex)
            updateMessages(messagesUpToUser)
            sendMessage(previousUserMessage.content)
          }
        }
        break
      case "edit":
        console.log("Edit functionality to be implemented")
        break
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white">Welcome to Reelevate.AI</h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Get creative ideas for your next viral reel by chatting with our AI assistant. Start a new conversation to
              begin your creative journey.
            </p>
          </div>
          <Button
            onClick={onNewConversation}
            className="bg-white hover:bg-white/80 text-black px-8 py-3 text-lg font-medium shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start New Conversation
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4 flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">{conversation.title}</h1>
            <p className="text-sm text-zinc-400">{conversation.messages.length} messages</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedModelRecord && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                {selectedModelRecord.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Start a conversation</h3>
              <p className="text-zinc-400">Ask for reel ideas, creative concepts, or trending topics</p>
            </div>
          ) : (
            conversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onAction={(action) => handleMessageAction(message.id, action)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4 flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={isModelLoaded ? "Enter your prompt here..." : "Please load a model first..."}
                className="min-h-[60px] max-h-[200px] pr-14 resize-none bg-zinc-800 border-zinc-700 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl text-white placeholder-zinc-400 font-tiempos"
                disabled={isGenerating || !isModelLoaded || isModelLoading}
              />
              {isGenerating || isModelLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleStop}
                  className="absolute right-2 bottom-2 h-10 w-10 bg-red-500 hover:bg-red-600 rounded-lg shadow-lg text-white"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 h-10 w-10 bg-white text-black hover:bg-zinc-200 hover:shadow-md rounded-lg shadow-lg transition-all duration-200"
                  disabled={!input.trim() || !isModelLoaded}
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <Dialog open={showModelSelector} onOpenChange={setShowModelSelector}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                      disabled={isModelLoading}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      {selectedModelRecord?.name || "Select Model"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 bg-zinc-900 border-zinc-800 text-white rounded-lg">
                    <ModelSelector
                      selectedModelId={selectedModelRecord?.id}
                      onModelSelect={handleModelSwitch}
                    />
                  </DialogContent>
                </Dialog>

                {isModelLoading && (
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Loading model... {Math.round(progress * 100)}%</span>
                  </div>
                )}
              </div>

              <div className="text-zinc-500">{isModelLoaded ? "Ready to chat" : "Load a model to start chatting"}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
