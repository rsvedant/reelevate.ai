"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AVAILABLE_MODELS } from "@/lib/constants"

interface ModelSelectorProps {
  onModelSelect?: (modelId: string) => void
}

export default function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0])

  useEffect(() => {
    // Load saved model from localStorage
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
      // Save to localStorage
      localStorage.setItem("selectedModelId", model.id)
      // Notify parent component
      if (onModelSelect) {
        onModelSelect(model.id)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-80 justify-between">
            <div className="flex flex-col items-start">
              <span>{selectedModel.name}</span>
              <span className="text-xs text-zinc-400">{selectedModel.size}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {AVAILABLE_MODELS.map((model) => (
                  <CommandItem key={model.id} value={model.id} onSelect={() => handleModelSelect(model.id)}>
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedModel.id === model.id ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-zinc-400">{model.size}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-zinc-500 text-center">Choose a smaller model for faster loading</p>
    </div>
  )
}
