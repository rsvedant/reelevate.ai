import type { ModelRecord } from "./types"

export const AVAILABLE_MODELS: ModelRecord[] = [
  {
    id: "https://huggingface.co/pr0methium/ReelevateLM-q4f16_1",
    name: "Reelevate Brainrot Chat (8B)",
    model: "ReelevateLM-q4f16_1",
    size: "~6GB",
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama Chat (1.1B)",
    model: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    size: "~700MB",
  },
  {
    id: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    name: "Llama 2 Chat (7B)",
    model: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    size: "~4GB",
  },
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
    name: "RedPajama Chat (3B)",
    model: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
    size: "~2GB",
  },
]

export const SYSTEM_PROMPT = `You are an AI assistant for Reelevate.AI, a platform that helps content creators generate ideas for social media reels. 
Your goal is to help users brainstorm creative, engaging, and trending reel ideas.
Be concise, creative, and provide specific ideas that would work well as short-form video content.
Focus on ideas that are likely to engage viewers and potentially go viral.
When appropriate, suggest hooks, transitions, music choices, or editing techniques.`
