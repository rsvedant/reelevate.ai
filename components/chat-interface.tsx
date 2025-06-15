"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useModel } from "@/hooks/use-model"
import { v4 as uuidv4 } from "uuid"
import type { Message, Conversation } from "@/lib/types"
import { SYSTEM_PROMPT } from "@/lib/constants"
import { Loader, Send, ChevronDown, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ChatMessage from "@/components/chat-message"
import ModelSelector from "@/components/model-selector"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatInterfaceProps {
  conversation?: Conversation
  onUpdateConversation: (conversationId: string, updates: Partial<Conversation>) => void
  onNewConversation: () => void
}

export default function ChatInterface({ conversation, onUpdateConversation, onNewConversation }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { model, loadModel, isModelLoaded, isModelLoading, progress, error, selectedModelRecord, switchModel } =
    useModel()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const updateMessages = (newMessages: Message[]) => {
    if (conversation) {
      onUpdateConversation(conversation.id, { messages: newMessages })
    }
  }

  const generateTitle = (firstMessage: string) => {
    // Generate a title from the first message (first 50 characters)
    return firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage
  }

  const sendMessage = async (content: string) => {
    if (!isModelLoaded || !model || !conversation) {
      console.error("Model not loaded or no active conversation")
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

    // Update conversation title if it's the first message
    if (conversation.messages.length === 0) {
      onUpdateConversation(conversation.id, { title: generateTitle(content) })
    }

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

      await model.chatCompletion(conversationHistory, {
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
        callback: (chunk: string) => {
          accumulatedContent += chunk

          // Update the AI message with accumulated content
          const updatedMessages = newMessages.map((msg, index) =>
            index === newMessages.length - 1 && msg.pending ? { ...msg, content: accumulatedContent } : msg,
          )
          updateMessages(updatedMessages)
        },
      })

      // Remove pending state
      const finalMessages = newMessages.map((msg, index) =>
        index === newMessages.length - 1 && msg.pending ? { ...msg, pending: false, content: accumulatedContent } : msg,
      )
      updateMessages(finalMessages)
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMessages = newMessages.map((msg, index) =>
        index === newMessages.length - 1 && msg.pending
          ? {
              ...msg,
              content: "Sorry, I encountered an error while generating a response. Please try again.",
              pending: false,
              error: true,
            }
          : msg,
      )
      updateMessages(errorMessages)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isGenerating || !isModelLoaded) return

    // Create new conversation if none exists
    if (!conversation) {
      onNewConversation()
      return
    }

    const userMessage = input.trim()
    setInput("")

    await sendMessage(userMessage)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleModelSwitch = async (modelId: string) => {
    setShowModelSelector(false)
    await switchModel(modelId)
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
        // TODO: Implement regenerate functionality
        break
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold">Welcome to Reelevate.AI</h2>
          <p className="text-zinc-400 max-w-md">
            Get creative ideas for your next viral reel by chatting with our AI assistant. Start a new conversation to
            begin.
          </p>
          <Button onClick={onNewConversation} className="bg-gradient-to-r from-purple-500 to-pink-500">
            Start New Conversation
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{conversation.title}</h1>
            <p className="text-sm text-zinc-400">{conversation.messages.length} messages</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedModelRecord && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                {selectedModelRecord.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-zinc-400 text-sm">Ask for reel ideas, creative concepts, or trending topics</p>
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
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={isModelLoaded ? "Ask for reel ideas..." : "Please load a model first..."}
                className="min-h-[60px] max-h-[200px] pr-12 resize-none bg-zinc-800 border-zinc-700 focus:border-purple-500"
                disabled={isGenerating || !isModelLoaded}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-purple-500 hover:bg-purple-600"
                disabled={isGenerating || !input.trim() || !isModelLoaded}
              >
                {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <DropdownMenu open={showModelSelector} onOpenChange={setShowModelSelector}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                      disabled={isModelLoading}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      {selectedModelRecord?.name || "Select Model"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 p-0" align="start" side="top">
                    <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
                      <h3 className="font-medium mb-3 text-white">Select Model</h3>
                      <ModelSelector onModelSelect={handleModelSwitch} />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

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
