"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, Search, Cpu, Bot, Star, ChevronDown, Shirt, WandSparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { AVAILABLE_MODELS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ModelRecord } from "@/lib/types"
import MetaIcon from "@/app/icons/meta.svg"
import MicrosoftIcon from "@/app/icons/microsoft.svg"
import MistralIcon from "@/app/icons/mistral.svg"
import GoogleIcon from "@/app/icons/google.svg"
import StablelmIcon from "@/app/icons/stablelm.svg"
import DeepSeekIcon from "@/app/icons/deepseek.svg"

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

interface ModelSelectorProps {
  selectedModelId?: string
  onModelSelect: (modelId: string) => void
}

interface ModelGroup {
  name: string
  family: string
  provider: string
  variants: ModelRecord[]
}

export default function ModelSelector({ selectedModelId, onModelSelect }: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFamily, setSelectedFamily] = useState<string>("All")

  const handleModelSelect = (model: ModelRecord) => {
    if (onModelSelect) {
      onModelSelect(model.id)
    }
  }

  const groupedModels: ModelGroup[] = useMemo(() => {
    const modelsMap = new Map<string, {
      family: string
      provider: string
      variants: ModelRecord[]
    }>()

    AVAILABLE_MODELS.forEach(model => {
      let family = model.family

      const baseName = model.name.replace(/ \(.*/, "")
      if (!modelsMap.has(baseName)) {
        modelsMap.set(baseName, {
          family: family,
          provider: model.provider,
          variants: []
        })
      }
      modelsMap.get(baseName)!.variants.push(model)
    })

    return Array.from(modelsMap.entries()).map(([name, data]) => ({ name, ...data }))
  }, [])

  const modelFamilies = useMemo(() => {
    const families = new Set(groupedModels.map((model) => model.family))
    return ["All", ...Array.from(families)]
  }, [groupedModels])

  const providerIcons: { [key: string]: React.ReactNode } = {
    All: <Star className="mr-3 flex-shrink-0" height={16} width={16} />,
    Reelevate: <Image src="/reelevate.png" alt="Reelevate Logo" className="mr-3 flex-shrink-0" height={16} width={16} />,
    Meta: <MetaIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    Google: <GoogleIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    Qwen: <Image src="/qwen.webp" alt="Qwen Logo" className="mr-3 flex-shrink-0" height={16} width={16} />,
    DeepSeek: <DeepSeekIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    Microsoft: <MicrosoftIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    Mistral: <MistralIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    StableLM: <StablelmIcon className="mr-3 flex-shrink-0" height={16} width={16} />,
    SmolLM: <Image src="/smollm.png" alt="SmolLM Logo" className="mr-3 flex-shrink-0" height={16} width={16} />,
    RedPajama: <Shirt className="mr-3 flex-shrink-0" height={16} width={16} />,
    WizardLM: <WandSparkles className="mr-3 flex-shrink-0" height={16} width={16} />,
    Other: <Bot className="mr-3 flex-shrink-0" height={16} width={16} />,
  }

  const familyToIconName = useMemo(() => {
    const map = new Map<string, string>()
    AVAILABLE_MODELS.forEach(model => {
      if (!map.has(model.family)) {
        map.set(model.family, model.icon)
      }
    })
    return map
  }, [])

  const filteredModels = useMemo(() => {
    return groupedModels.filter((group) => {
      const matchesFamily = selectedFamily === "All" || group.family === selectedFamily
      const matchesSearch =
        searchQuery === "" || group.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFamily && matchesSearch
    })
  }, [searchQuery, selectedFamily, groupedModels])

  return (
    <>
      <DialogHeader className="p-6 border-b border-zinc-800">
        <DialogTitle className="text-xl font-semibold">Model Selection</DialogTitle>
      </DialogHeader>
      <div className="p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border-zinc-700 pl-9 rounded-lg h-11"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {modelFamilies
            .map((family) => (
              <Button
                key={family}
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedFamily(family === selectedFamily ? "All" : family)
                }
                className={cn(
                  "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg px-4 py-2",
                  selectedFamily === family &&
                    "bg-zinc-700 text-zinc-50 border-zinc-600",
                )}
              >
                {
                  providerIcons[
                    family === "All" ? "All" : familyToIconName.get(family) || "Other"
                  ]
                }
                <span className="whitespace-nowrap">{family}</span>
              </Button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[45vh] overflow-y-auto pr-2">
          {filteredModels.length > 0 ? (
            filteredModels.map((group) => {
              const icon = providerIcons[group.variants[0].icon] || providerIcons["Other"]
              if (group.variants.length === 1) {
                const model = group.variants[0]
                return (
                  <Button
                    key={model.id}
                    variant="outline"
                    className={cn(
                      "justify-start h-auto min-h-[60px] p-4 w-full text-left rounded-lg",
                      "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors",
                      selectedModelId === model.id && "bg-zinc-800 border-zinc-700",
                    )}
                    onClick={() => handleModelSelect(model)}
                  >
                    <div className="flex items-center gap-0 w-full min-w-0">
                      {icon}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm text-zinc-100 block leading-tight">
                          {group.name}
                        </span>
                      </div>
                    </div>
                  </Button>
                )
              } else {
                const currentlySelectedVariant = group.variants.find((v) => v.id === selectedModelId)
                return (
                  <DropdownMenu key={group.name} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-between h-auto min-h-[60px] pl-3 pr-4 py-4 w-full text-left rounded-lg",
                          "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors",
                          currentlySelectedVariant && "bg-zinc-800 border-zinc-700",
                        )}
                      >
                        <div className="flex items-center gap-0 w-full min-w-0 mr-6">
                          {icon}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-sm text-zinc-100 block leading-tight">
                              {group.name}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      sideOffset={4}
                      align="end"
                      className="w-72 bg-zinc-950 border-zinc-800 text-white"
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-sm font-medium">
                        {group.provider}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      {group.variants.map((variant) => (
                        <DropdownMenuItem
                          key={variant.id}
                          onSelect={() => handleModelSelect(variant)}
                          className="focus:bg-zinc-800 focus:text-white px-3 py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 flex-shrink-0",
                              selectedModelId === variant.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="text-sm leading-tight">
                            {variant.name.match(/\((.*)\)/)?.[1] || variant.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            })
          ) : (
            <div className="col-span-full text-center py-12 text-zinc-500">
              <p className="font-medium text-base">No models found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}