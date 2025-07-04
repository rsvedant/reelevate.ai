"use client"

import { motion } from "framer-motion"
import { HoverEffect } from "@/components/ui/card-hover-effect"
import { Wand2, Layers, Cpu, Upload, Zap, Sparkles, Lock, Target } from "lucide-react"

const features = [
  {
    icon: Wand2,
    title: "Local LLM Playground",
    description: "Chat with local AI to craft and refine your reel script effortlessly.",
  },
  {
    icon: Layers,
    title: "100+ Open-Source Models",
    description: "Choose from over 100 open-source LLMs from top providers like  DeepSeek, Microsoft, Google, Meta, Alibaba and more.",
  },
  {
    icon: Cpu,
    title: "100% Local AI Inference",
    description: "Run all AI processing entirely on-device for maximum privacy with no data leaving your device.",
  },
  {
    icon: Upload,
    title: "Custom Background Videos",
    description: "Upload any video as your reel's backdrop to tell your story your way.",
  },
  {
    icon: Lock,
    title: "Complete Data Privacy",
    description: "All data and AI models run locally; no user data is stored on a server—everything stays in your browser.",
  },
  {
    icon: Target,
    title: "Advanced Customization",
    description: "Fine-tune subtitle themes, narration voice, and video resolution to match your brand's vision.",
  },
]

export function FeaturesSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center"
    >
      <h2 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-10 md:mb-12 text-primary max-w-[92%] sm:max-w-4xl leading-tight tracking-tight">
        Unlock effortless reel creation, and save hours, because your story deserves to shine.
      </h2>
      <div className="w-full max-w-7xl px-2 sm:px-4">
        <HoverEffect items={features} />
      </div>
    </motion.div>
  )
}