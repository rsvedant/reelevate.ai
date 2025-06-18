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
  const isLoadingCancelledRef = useRef(false)

  const ensureWebLLMLoaded = async (): Promise<typeof import("@mlc-ai/web-llm")> => {
    if (webllmRef.current) return webllmRef.current
    if (typeof window === "undefined") throw new Error("WebLLM can only run in a browser environment")
    const webllmModule = await import("@mlc-ai/web-llm")
    webllmRef.current = webllmModule
    if (!webllmModule.CreateMLCEngine) throw new Error("WebLLM CreateMLCEngine function not available")
    return webllmModule
  }

  useEffect(() => {
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
        setError("Failed to initialize WebLLM")
      }
    }
    initWebLLM()
  }, [])

  const isCustomModelUrl = (modelId: string): boolean => {
    return modelId.startsWith("http://") || modelId.startsWith("https://")
  }

  const createCustomModelConfig = async (modelRecord: ModelRecord) => {
    const webllm = await ensureWebLLMLoaded()
    return {
      model: modelRecord.id,
      model_id: modelRecord.model,
      model_lib: webllm.modelLibURLPrefix + webllm.modelVersion + "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    }
  }

  const createAppConfig = (modelRecord: ModelRecord) => {
    const appConfig = {
      useIndexedDB: true,
      model_list: [] as any[],
    }
    if (isCustomModelUrl(modelRecord.id)) {
      appConfig.model_list.push({
        model_id: modelRecord.model,
        model_url: modelRecord.id,
        vram_required_MB: 8192,
        low_resource_required: false,
      })
    } else {
      appConfig.model_list.push({ model_id: modelRecord.model })
    }
    return appConfig
  }

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
      isLoadingCancelledRef.current = false

      try {
        const webllm = await ensureWebLLMLoaded()
        const isCustomModel = isCustomModelUrl(modelRecord.id)

        if (engineRef.current) {
          await engineRef.current.unload()
          engineRef.current = null
        }

        let engine
        try {
          if (isCustomModel) {
            const modelConfig = await createCustomModelConfig(modelRecord)
            const appConfig = { model_list: [modelConfig] }

            engine = await webllm.CreateMLCEngine(modelRecord.model, {
              appConfig,
              initProgressCallback: (report: any) => {
                if (isLoadingCancelledRef.current) {
                  setIsModelLoading(false)
                  setProgress(0)
                  setError("Model loading cancelled by user.")
                  throw new Error("Model loading cancelled by user.")
                }
                if (report && typeof report.progress === "number") {
                  setProgress(Math.max(0, Math.min(1, report.progress)))
                }
              },
            })
          } else {
            const appConfig = createAppConfig(modelRecord)
            const engineOptions = {
              appConfig,
              initProgressCallback: (report: any) => {
                if (isLoadingCancelledRef.current) {
                  setIsModelLoading(false)
                  setProgress(0)
                  setError("Model loading cancelled by user.")
                  throw new Error("Model loading cancelled by user.")
                }
                if (report && typeof report.progress === "number") {
                  setProgress(Math.max(0, Math.min(1, report.progress)))
                }
              },
            }
            engine = await webllm.CreateMLCEngine(modelRecord.model, engineOptions)
          }
        } catch (engineError: any) {
          if (!isLoadingCancelledRef.current) {
            if (isCustomModel) {
              setError(`Custom model loading failed: ${engineError.message || "Unknown error"}. Please ensure the model URL is correct and the model is compatible with WebLLM.`)
              throw new Error(`Custom model loading failed: ${engineError.message || "Unknown error"}. Please ensure the model URL is correct and the model is compatible with WebLLM.`)
            } else {
              setError(`Model loading failed: ${engineError.message || "Unknown error"}`)
              throw new Error(`Model loading failed: ${engineError.message || "Unknown error"}`)
            }
          }
        }

        if (isLoadingCancelledRef.current || !engine) {
          if (engine) await engine.unload()
          return
        }

        engineRef.current = engine

        const modelWrapper: WebLLMModel = {
          engine,
          name: modelRecord.name,
          id: modelRecord.id,
          chatCompletion: async (messages: any[], options: any = {}) => {
            try {
              if (!engine || !engine.chat || !engine.chat.completions) {
                throw new Error("Model engine not properly initialized")
              }

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

              if (options.stream && options.callback) {
                try {
                  const completion = await engine.chat.completions.create({
                    ...completionOptions,
                    stream: true,
                  })

                  for await (const chunk of completion) {
                    const content = chunk.choices?.[0]?.delta?.content || ""
                    if (content) {
                      fullResponse += content
                      options.callback(content)
                    }
                  }
                } catch (streamError) {
                  const completion = await engine.chat.completions.create({
                    ...completionOptions,
                    stream: false,
                  })
                  fullResponse = completion.choices?.[0]?.message?.content || ""
                  if (fullResponse && options.callback) {
                    options.callback(fullResponse)
                  }
                }
              } else {
                const completion = await engine.chat.completions.create({
                  ...completionOptions,
                  stream: false,
                })
                fullResponse = completion.choices?.[0]?.message?.content || ""
              }

              return fullResponse
            } catch (chatError: any) {
              throw new Error(`Chat failed: ${chatError.message || "Unknown error"}`)
            }
          },
        }

        setModel(modelWrapper)
        setIsModelLoaded(true)
        setProgress(1)
        localStorage.setItem("selectedModelId", modelRecord.id)
      } catch (err: any) {
        if (!isLoadingCancelledRef.current) {
          setError(err.message || "Failed to load model. Please try again.")
        }
      } finally {
        if (!isLoadingCancelledRef.current) {
          setIsModelLoading(false)
        }
      }
    },
    [model],
  )

  const loadModel = useCallback(async () => {
    if (selectedModelRecord) {
      await loadModelById(selectedModelRecord.id)
    }
  }, [selectedModelRecord, loadModelById])

  const switchModel = useCallback(async (modelId: string) => {
    await loadModelById(modelId)
  }, [loadModelById])

  const clearModelCache = useCallback(async () => {
    try {
      if ("indexedDB" in window) {
        const databases = await indexedDB.databases()
        const webllmDbs = databases.filter((db) => db.name?.includes("webllm") || db.name?.includes("mlc"))

        for (const db of webllmDbs) {
          if (db.name) {
            const deleteReq = indexedDB.deleteDatabase(db.name)
            await new Promise((resolve, reject) => {
              deleteReq.onsuccess = () => resolve(true)
              deleteReq.onerror = () => reject(deleteReq.error)
            })
          }
        }
      }
    } catch (error) {}
  }, [])

  return {
    model,
    loadModel,
    switchModel,
    clearModelCache,
    isModelLoaded,
    isModelLoading,
    progress,
    error,
    selectedModelRecord,
  }
}