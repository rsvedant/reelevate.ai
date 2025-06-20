"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ModelRecord, WebLLMModel } from "@/lib/types"
import { AVAILABLE_MODELS } from "@/lib/constants"

import type * as WebLLMTypes from "@mlc-ai/web-llm"

export function useModel() {
  const [model, setModel] = useState<WebLLMModel | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedModelRecord, setSelectedModelRecord] = useState<ModelRecord | null>(null)

  const webllmRef = useRef<typeof import("@mlc-ai/web-llm") | null>(null)
  const engineRef = useRef<WebLLMTypes.MLCEngine | null>(null)
  const initialLoadStartedRef = useRef(false)
  const activeLoadRef = useRef<Promise<WebLLMTypes.MLCEngine> | null>(null)

  const ensureWebLLMLoaded = async (): Promise<typeof import("@mlc-ai/web-llm")> => {
    if (webllmRef.current) {
      return webllmRef.current
    }

    try {
      if (typeof window === "undefined") {
        setError("WebLLM can only run in a browser environment")
        throw new Error("WebLLM can only run in a browser environment")
      }

      const webllmModule = await import("@mlc-ai/web-llm")
      webllmRef.current = webllmModule
      console.log("WebLLM module loaded:", Object.keys(webllmModule))

      if (!webllmModule.CreateMLCEngine) {
        setError("WebLLM CreateMLCEngine function not available")
        throw new Error("WebLLM CreateMLCEngine function not available")
      }

      return webllmModule
    } catch (importError) {
      setError("Failed to load WebLLM library. Please refresh the page and try again.")
      throw new Error("Failed to load WebLLM library. Please refresh the page and try again.")
    }
  }

  const unloadModel = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.unload()
      engineRef.current = null
      setModel(null)
      setIsModelLoaded(false)
      setIsModelLoading(false)
      setProgress(0)
      console.log("Model unloaded.")
    }
  }, [])

  const stop = useCallback(async () => {
    if (isModelLoading) {
      console.log("Attempting to cancel model loading...")
      activeLoadRef.current = null
      if (engineRef.current) {
        await engineRef.current.unload()
        engineRef.current = null
      }
      setModel(null)
      setIsModelLoaded(false)
      setIsModelLoading(false)
      setProgress(0)
      setError("Model loading cancelled by user.")
    } else if (model?.engine) {
      try {
        await model.engine.interruptGenerate()
        console.log("Generation interrupted by user.")
      } catch (err) {
        console.error("Error interrupting generation:", err)
      }
    }
  }, [isModelLoading, model])

  useEffect(() => {
    if (initialLoadStartedRef.current) {
      return
    }
    initialLoadStartedRef.current = true
    
    const initWebLLM = async () => {
      try {
        await ensureWebLLMLoaded()

        const savedModelId = localStorage.getItem("selectedModelId")
        if (savedModelId) {
          const modelToUse = AVAILABLE_MODELS.find((m) => m.id === savedModelId)
          if (modelToUse) {
            setSelectedModelRecord(modelToUse)
            loadModelById(savedModelId)
          }
        }
      } catch (err) {
        console.error("Error initializing WebLLM:", err)
        setError("Failed to initialize WebLLM")
      }
    }

    initWebLLM()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isCustomModelUrl = (modelId: string): boolean => {
    return modelId.startsWith('http://') || modelId.startsWith('https://')
  }

  const createCustomModelConfig = async (modelRecord: ModelRecord) => {
    const webllm = await ensureWebLLMLoaded()
    return {
      model: modelRecord.id,
      model_id: modelRecord.model,
      model_lib: 
      webllm.modelLibURLPrefix +
      webllm.modelVersion +
      modelRecord.lib
    }
  }  

  const loadModelById = useCallback(async (modelId: string) => {
    if (engineRef.current) {
      await unloadModel()
    }

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

    const loadPromise = (async () => {
      const webllm = await ensureWebLLMLoaded()
      console.log("Creating WebLLM engine for model:", modelRecord.model)
      const isCustomModel = isCustomModelUrl(modelRecord.id)
      const engineOptions: any = isCustomModel
        ? {
            appConfig: {
              model_list: [await createCustomModelConfig(modelRecord)],
              useIndexedDB: true,
            },
            initProgressCallback: (report: any) => {
              if (activeLoadRef.current !== loadPromise) {
                setIsModelLoading(false)
                setProgress(0)
                setError("Model loading cancelled by user.")
                throw new Error("Model loading cancelled by user.")
              }
              console.log("Loading progress:", report)
              if (typeof report.progress === "number") {
                setProgress(Math.max(0, Math.min(1, report.progress)))
              }
            },
          }
        : {
            initProgressCallback: (report: any) => {
              if (activeLoadRef.current !== loadPromise) {
                setIsModelLoading(false)
                setProgress(0)
                setError("Model loading cancelled by user.")
                throw new Error("Model loading cancelled by user.")
              }
              console.log("Loading progress:", report)
              if (typeof report.progress === "number") {
                setProgress(Math.max(0, Math.min(1, report.progress)))
              }
            },
          }

      if (isCustomModel) {
        console.log("Loading custom model from:", modelRecord.id)
      }
      return webllm.CreateMLCEngine(modelRecord.model, engineOptions)
    })()

    activeLoadRef.current = loadPromise

    try {
      const engine = await loadPromise
      if (activeLoadRef.current !== loadPromise) {
        await engine.unload()
        return
      }
      engineRef.current = engine
      console.log("WebLLM engine created successfully")

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
                const completion = await engine.chat.completions.create({
                  ...completionOptions,
                  stream: false,
                })
                fullResponse = completion.choices?.[0]?.message?.content || ""
                console.log("Non-streaming fallback response:", fullResponse)
                if (fullResponse && options.callback) {
                  options.callback(fullResponse)
                }
              }
            } else {
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
            setError(`Chat failed: ${chatError.message || "Unknown error"}`)
            throw new Error(`Chat failed: ${chatError.message || "Unknown error"}`)
          }
        },
      }

      setModel(modelWrapper)
      setIsModelLoaded(true)
      setProgress(1)
      localStorage.setItem("selectedModelId", modelRecord.id)
      console.log("Model loaded successfully:", modelRecord.name)
    } catch (err: any) {
      console.error("Error loading model:", err)
      if (activeLoadRef.current === loadPromise) {
        setError(err.message || "Failed to load model. Please try again.")
      }
    } finally {
      if (activeLoadRef.current === loadPromise) {
        setIsModelLoading(false)
      }
    }
  }, [])

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
    setError,
    error,
    selectedModelRecord,
    stop,
  }
}
