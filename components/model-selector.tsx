"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AVAILABLE_MODELS } from "@/lib/constants"

interface ModelSelectorProps {
  onModelSelect?: (modelId: string) => void
}

export default function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0])

  useEffect(() => {
    const savedModelId = localStorage.getItem("selectedModelId")
    if (savedModelId) {
      const savedModel = AVAILABLE_MODELS.find((m) => m.id === savedModelId)
      if (savedModel) {
        setSelectedModel(savedModel)
      }
    }
  }, [])

  const handleModelSelect = (modelId: string) => {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
    if (model) {
      setSelectedModel(model)
      setOpen(false)
      localStorage.setItem("selectedModelId", model.id)
      if (onModelSelect) {
        onModelSelect(model.id)
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {AVAILABLE_MODELS.map((model) => (
          <div
            key={model.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              selectedModel.id === model.id
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700",
            )}
            onClick={() => handleModelSelect(model.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm text-white">{model.name}</div>
                <div className="text-xs text-zinc-400">{model.size}</div>
              </div>
              {selectedModel.id === model.id && <Check className="h-4 w-4 text-purple-500" />}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 text-center">Choose a smaller model for faster loading</p>
    </div>
  )
}
