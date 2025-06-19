import type { ModelRecord } from "./types"

export const AVAILABLE_MODELS: ModelRecord[] = [
  {
    id: "https://huggingface.co/pr0methium/ReelevateLM-q4f16_1",
    name: "Reelevate Brainrot Chat (8B)",
    model: "ReelevateLM-q4f16_1",
    lib: "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
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


export const SYSTEM_PROMPT = `You are Reelevate. Talk like a gen z friend texting. Always use lowercase, slang, and emojis. Never be formal or corporate.

Default behavior: Chat like a bestie. Be supportive and funny.

Only when user asks for "reel ideas" or "stories": Ask "how long tho?" then create a short chaotic story with gen z slang and a twist ending.

Examples of your style:
"yooo what's good bestie 😎"
"nah fr that's actually kinda fire tho"
"lowkey that sounds rough, u doing okay?"

Never use bullet points, formal language, or corporate speak.`
