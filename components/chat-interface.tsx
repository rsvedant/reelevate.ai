"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useModel } from "@/hooks/use-model"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { v4 as uuidv4 } from "uuid"
import type { Message } from "@/lib/types"
import { SYSTEM_PROMPT } from "@/lib/constants"
import { Loader, AlertCircle, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ChatMessage from "@/components/chat-message"
import ModelSelector from "@/components/model-selector"

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { model, loadModel, isModelLoaded, isModelLoading, progress, error } = useModel()
  const { saveMessages, loadMessages, clearAllMessages } = useIndexedDB()

  // Load messages from IndexedDB on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const savedMessages = await loadMessages()
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages)
        }
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    fetchMessages()
  }, [loadMessages])

  // Save messages to IndexedDB whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages).catch((error) => {
        console.error("Error saving messages:", error)
      })
    }
  }, [messages, saveMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    console.log("sendMessage called with:", content)
    console.log("isModelLoaded:", isModelLoaded)
    console.log("model:", model)

    if (!isModelLoaded || !model) {
      console.error("Model not loaded, cannot send message")
      return
    }

    console.log("Sending message:", content)

    // Add user message immediately
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    // Add AI message with pending state
    const aiMessage: Message = {
      id: uuidv4(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      pending: true,
    }

    // Update state with both messages immediately
    setMessages((prev) => {
      console.log("Adding messages to state:", [...prev, userMessage, aiMessage])
      return [...prev, userMessage, aiMessage]
    })
    setIsGenerating(true)

    try {
      console.log("Preparing conversation history")
      // Prepare conversation history for the model
      const conversationHistory = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages
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

      console.log("Conversation history:", conversationHistory)

      let responseContent = ""

      // Generate response with streaming
      await model.chatCompletion(conversationHistory, {
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
        callback: (chunk: string) => {
          console.log("Received chunk:", chunk)
          responseContent += chunk

          setMessages((prev) => {
            const updatedMessages = [...prev]
            const lastMessageIndex = updatedMessages.length - 1
            const lastMessage = updatedMessages[lastMessageIndex]

            if (lastMessage && lastMessage.role === "assistant" && lastMessage.pending) {
              updatedMessages[lastMessageIndex] = {
                ...lastMessage,
                content: lastMessage.content + chunk,
              }
            }

            return updatedMessages
          })
        },
      })

      console.log("Chat completion finished, full response:", responseContent)

      // Update the AI message to remove pending state
      setMessages((prev) => {
        const updatedMessages = [...prev]
        const lastMessageIndex = updatedMessages.length - 1
        const lastMessage = updatedMessages[lastMessageIndex]

        if (lastMessage && lastMessage.role === "assistant" && lastMessage.pending) {
          updatedMessages[lastMessageIndex] = {
            ...lastMessage,
            pending: false,
          }
        }

        return updatedMessages
      })

      console.log("Chat completed successfully")
    } catch (error) {
      console.error("Error generating response:", error)

      // Update the AI message with an error
      setMessages((prev) => {
        const updatedMessages = [...prev]
        const lastMessageIndex = updatedMessages.length - 1
        const lastMessage = updatedMessages[lastMessageIndex]

        if (lastMessage && lastMessage.role === "assistant" && lastMessage.pending) {
          updatedMessages[lastMessageIndex] = {
            ...lastMessage,
            content: "Sorry, I encountered an error while generating a response. Please try again.",
            pending: false,
            error: true,
          }
        }

        return updatedMessages
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const clearMessages = async () => {
    try {
      await clearAllMessages()
      setMessages([])
    } catch (error) {
      console.error("Error clearing messages:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isGenerating || !isModelLoaded) {
      console.log("Cannot submit:", {
        inputEmpty: !input.trim(),
        isGenerating,
        isModelLoaded,
      })
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

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleRetry = () => {
    // Clear any existing error and try loading again
    loadModel()
  }

  const handleClearCache = () => {
    // Clear browser cache and reload
    if (typeof window !== "undefined") {
      // Clear localStorage
      localStorage.removeItem("selectedModelId")

      // Clear IndexedDB cache if possible
      if (window.indexedDB) {
        const deleteReq = window.indexedDB.deleteDatabase("webllm-cache")
        deleteReq.onsuccess = () => {
          console.log("WebLLM cache cleared")
          window.location.reload()
        }
        deleteReq.onerror = () => {
          console.log("Failed to clear cache, reloading anyway")
          window.location.reload()
        }
      } else {
        window.location.reload()
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {error && (
        <Alert className="mb-4 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            <div className="flex flex-col space-y-2">
              <span>{error}</span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleRetry} className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearCache} className="text-xs">
                  Clear Cache & Reload
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isModelLoaded && !error && (
        <Alert className="mb-4 border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-400">
            Model loaded successfully! You can now start chatting.
          </AlertDescription>
        </Alert>
      )}

      {!isModelLoaded && !isModelLoading && (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Reelevate.AI</h2>
          <p className="text-center text-zinc-400 max-w-md">
            Get creative ideas for your next viral reel by chatting with our AI assistant.
          </p>
          <ModelSelector />
          <Button onClick={loadModel} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
            Load Model
          </Button>
          <p className="text-xs text-zinc-500 text-center max-w-sm">
            Note: This app requires a modern browser with WebAssembly support.
          </p>
        </div>
      )}

      {isModelLoading && (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Loader className="h-8 w-8 animate-spin text-purple-500" />
          <h2 className="text-xl font-semibold">Loading Model...</h2>
          <div className="w-64 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-zinc-400">{Math.round(progress * 100)}%</p>
          <p className="text-xs text-zinc-500 text-center max-w-sm">
            This may take a few minutes on first load. The model will be cached for future use.
          </p>
          {progress > 0.5 && (
            <p className="text-xs text-zinc-400 text-center">Almost there! Initializing the model...</p>
          )}
        </div>
      )}

      {isModelLoaded && (
        <>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-purple-500/10 p-4 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-purple-500"
                  >
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Start a conversation</h3>
                <p className="text-zinc-400 text-sm max-w-sm mt-1">
                  Ask for reel ideas, creative concepts, or trending topics
                </p>
                <div className="mt-4 text-xs text-zinc-500 space-y-1">
                  <p>Try asking:</p>
                  <p>"Give me 5 trending reel ideas for fitness content"</p>
                  <p>"What's a good hook for a cooking reel?"</p>
                </div>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="relative">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for reel ideas..."
                  className="min-h-[50px] max-h-[200px] pr-12 resize-none"
                  disabled={isGenerating || !isModelLoaded}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 bg-purple-500 hover:bg-purple-600"
                  disabled={isGenerating || !input.trim() || !isModelLoaded}
                >
                  {isGenerating ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z"></path>
                      <path d="M22 2 11 13"></path>
                    </svg>
                  )}
                </Button>
              </div>
            </form>

            <div className="flex justify-between items-center mt-2 text-xs text-zinc-400">
              <div>{isModelLoaded && <span>Model: {model?.name || "Unknown"}</span>}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="h-auto p-1 text-xs"
                disabled={messages.length === 0 || isGenerating}
              >
                Clear chat
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
