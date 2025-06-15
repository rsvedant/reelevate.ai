"use client"

import { useState, useEffect, useCallback } from "react"
import type { ModelRecord, WebLLMModel } from "@/lib/types"
import { AVAILABLE_MODELS } from "@/lib/constants"

export function useModel() {
  const [model, setModel] = useState<WebLLMModel | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedModelRecord, setSelectedModelRecord] = useState<ModelRecord | null>(null)

  // Initialize WebLLM when the component mounts
  useEffect(() => {
    const initWebLLM = async () => {
      try {
        // Check if there's a previously selected model in localStorage
        const savedModelId = localStorage.getItem("selectedModelId")
        if (savedModelId) {
          const modelToUse = AVAILABLE_MODELS.find((m) => m.id === savedModelId)
          if (modelToUse) {
            setSelectedModelRecord(modelToUse)
            // Auto-load the saved model
            loadModelById(savedModelId)
          }
        }
      } catch (err) {
        console.error("Error initializing WebLLM:", err)
        setError("Failed to initialize WebLLM")
      }
    }

    initWebLLM()
  }, [])

  const loadModelById = useCallback(
    async (modelId: string) => {
      const modelRecord = AVAILABLE_MODELS.find((m) => m.id === modelId)
      if (!modelRecord) {
        setError(`Model ${modelId} not found`)
        return
      }

      setSelectedModelRecord(modelRecord)
      setIsModelLoading(true)
      setProgress(0)
      setError(null)
      setIsModelLoaded(false)

      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          throw new Error("WebLLM can only run in a browser environment")
        }

        // Dynamically import WebLLM with error handling
        let webllmModule
        try {
          webllmModule = await import("@mlc-ai/web-llm")
          console.log("WebLLM module loaded:", Object.keys(webllmModule))
        } catch (importError) {
          console.error("Failed to import WebLLM:", importError)
          throw new Error("Failed to load WebLLM library. Please refresh the page and try again.")
        }

        // Check if the required functions exist
        if (!webllmModule.CreateMLCEngine) {
          throw new Error("WebLLM CreateMLCEngine function not available")
        }

        console.log("Creating WebLLM engine for model:", modelRecord.model)

        // Dispose of existing model if any
        if (model?.engine) {
          try {
            await model.engine.dispose()
          } catch (disposeError) {
            console.warn("Error disposing previous model:", disposeError)
          }
        }

        // Create engine with comprehensive error handling
        let engine
        try {
          engine = await webllmModule.CreateMLCEngine(modelRecord.model, {
            initProgressCallback: (report: any) => {
              console.log("Loading progress:", report)
              if (report && typeof report.progress === "number") {
                setProgress(Math.max(0, Math.min(1, report.progress)))
              }
            },
          })
        } catch (engineError: any) {
          console.error("Engine creation failed:", engineError)
          throw new Error(`Model loading failed: ${engineError.message || "Unknown error"}`)
        }

        if (!engine) {
          throw new Error("Failed to create WebLLM engine")
        }

        console.log("WebLLM engine created successfully")

        // Create a wrapper object that matches our interface
        const modelWrapper: WebLLMModel = {
          engine,
          name: modelRecord.name,
          id: modelRecord.id,
          chatCompletion: async (messages: any[], options: any = {}) => {
            try {
              if (!engine || !engine.chat || !engine.chat.completions) {
                throw new Error("Model engine not properly initialized")
              }

              console.log("Starting chat completion with messages:", messages)

              let fullResponse = ""

              // Convert messages to the format expected by WebLLM
              const formattedMessages = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              }))

              const completionOptions = {
                messages: formattedMessages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 800,
                stream: options.stream || false,
              }

              console.log("Completion options:", completionOptions)

              if (options.stream && options.callback) {
                // Handle streaming response
                try {
                  console.log("Starting streaming completion")
                  const completion = await engine.chat.completions.create({
                    ...completionOptions,
                    stream: true,
                  })

                  console.log("Streaming completion created, processing chunks")
                  for await (const chunk of completion) {
                    const content = chunk.choices?.[0]?.delta?.content || ""
                    if (content) {
                      console.log("Received chunk:", content)
                      fullResponse += content
                      options.callback(content)
                    }
                  }
                  console.log("Streaming completed, full response:", fullResponse)
                } catch (streamError) {
                  console.error("Streaming error, falling back to non-streaming:", streamError)
                  // Fallback to non-streaming if streaming fails
                  const completion = await engine.chat.completions.create({
                    ...completionOptions,
                    stream: false,
                  })
                  fullResponse = completion.choices?.[0]?.message?.content || ""
                  console.log("Non-streaming fallback response:", fullResponse)
                  if (fullResponse && options.callback) {
                    // Simulate streaming by sending the full response
                    options.callback(fullResponse)
                  }
                }
              } else {
                // Handle non-streaming response
                console.log("Starting non-streaming completion")
                const completion = await engine.chat.completions.create({
                  ...completionOptions,
                  stream: false,
                })
                fullResponse = completion.choices?.[0]?.message?.content || ""
                console.log("Non-streaming response:", fullResponse)
              }

              return fullResponse
            } catch (chatError: any) {
              console.error("Error in chat completion:", chatError)
              throw new Error(`Chat failed: ${chatError.message || "Unknown error"}`)
            }
          },
        }

        setModel(modelWrapper)
        setIsModelLoaded(true)
        setProgress(1)

        // Save the selected model to localStorage
        localStorage.setItem("selectedModelId", modelRecord.id)

        console.log("Model loaded successfully:", modelRecord.name)
      } catch (err: any) {
        console.error("Error loading model:", err)
        setError(err.message || "Failed to load model. Please try again.")
      } finally {
        setIsModelLoading(false)
      }
    },
    [model],
  )

  const loadModel = useCallback(async () => {
    if (selectedModelRecord) {
      await loadModelById(selectedModelRecord.id)
    }
  }, [selectedModelRecord, loadModelById])

  const switchModel = useCallback(
    async (modelId: string) => {
      console.log("Switching to model:", modelId)
      await loadModelById(modelId)
    },
    [loadModelById],
  )

  return {
    model,
    loadModel,
    switchModel,
    isModelLoaded,
    isModelLoading,
    progress,
    error,
    selectedModelRecord,
  }
}
