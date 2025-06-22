import type { ModelRecord } from "./types"

export const SYSTEM_PROMPT = `You are Reelevate. Talk like a gen z friend texting. Always use lowercase, slang, and emojis. Never be formal or corporate.

Default behavior: Chat like a bestie. Be supportive and funny.

Only when user asks for "reel ideas" or "stories": Ask "how long tho?" then create a short chaotic story with gen z slang and a twist ending.

Examples of your style:
"yooo what's good bestie 😎"
"nah fr that's actually kinda fire tho"
"lowkey that sounds rough, u doing okay?"

Never use bullet points, formal language, or corporate speak.`

const qwen3_common_configs = {
  family: "Qwen",
  provider: "Alibaba",
  // Recommended config is for non-thinking mode
  // For thinking mode, apply temperature=0.6 and top_p=0.95
  recommended_config: {
    temperature: 0.7,
    presence_penalty: 0,
    frequency_penalty: 0,
    top_p: 0.8,
  },
  icon: "Qwen"
}

export const AVAILABLE_MODELS: ModelRecord[] = [
  {
    id: "https://huggingface.co/pr0methium/ReelevateLM-q4f16_1",
    name: "Reelevate Brainrot Chat 8B (q4f16_1)",
    provider: "Reelevate",
    model: "ReelevateLM-q4f16_1",
    lib: "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    family: "Reelevate",
    icon: "Reelevate"
  },
  // Phi-3.5 Vision
  {
    id: "Phi-3.5-vision-instruct-q4f32_1-MLC",
    name: "Phi 3.5 vision instruct (q4f32_1)",
    model: "Phi-3.5-vision-instruct-q4f32_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3.5-vision-instruct-q4f16_1-MLC",
    name: "Phi 3.5 vision instruct (q4f16_1)",
    model: "Phi-3.5-vision-instruct-q4f16_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  // Llama-3.2
  {
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 1B Instruct (q4f32_1)",
    model: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B Instruct (q4f16_1)",
    model: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.2-1B-Instruct-q0f32-MLC",
    name: "Llama 3.2 1B Instruct (q0f32)",
    model: "Llama-3.2-1B-Instruct-q0f32-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.2-1B-Instruct-q0f16-MLC",
    name: "Llama 3.2 1B Instruct (q0f16)",
    model: "Llama-3.2-1B-Instruct-q0f16-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 3B Instruct (q4f32_1)",
    model: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B Instruct (q4f16_1)",
    model: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  // Llama-3.1 8B
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
    name: "Llama 3.1 8B Instruct (q4f32_1-1k)",
    model: "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
    name: "Llama 3.1 8B Instruct (q4f16_1-1k)",
    model: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3.1 8B Instruct (q4f32_1)",
    model: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 8B Instruct (q4f16_1)",
    model: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  // DeepSeek
  {
    id: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
    name: "DeepSeek R1 Distill Qwen 7B (q4f16_1)",
    model: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
    provider: "DeepSeek",
    family: "DeepSeek",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "DeepSeek"
  },
  {
    id: "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC",
    name: "DeepSeek R1 Distill Qwen 7B (q4f32_1)",
    model: "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC",
    provider: "DeepSeek",
    family: "DeepSeek",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "DeepSeek"
  },
  {
    id: "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
    name: "DeepSeek R1 Distill Llama 8B (q4f32_1)",
    model: "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
    provider: "DeepSeek",
    family: "DeepSeek",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "DeepSeek"
  },
  {
    id: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
    name: "DeepSeek R1 Distill Llama 8B (q4f16_1)",
    model: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
    provider: "DeepSeek",
    family: "DeepSeek",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "DeepSeek"
  },
  // Hermes
  {
    id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    name: "Hermes 3 Llama 3.2 3B (q4f32_1)",
    model: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
    name: "Hermes 3 Llama 3.2 3B (q4f16_1)",
    model: "Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-3-Llama-3.1-8B-q4f32_1-MLC",
    name: "Hermes 3 Llama 3.1 8B (q4f32_1)",
    model: "Hermes-3-Llama-3.1-8B-q4f32_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
    name: "Hermes 3 Llama 3.1 8B (q4f16_1)",
    model: "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC",
    name: "Hermes 2 Pro Mistral 7B (q4f16_1)",
    model: "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
    name: "Hermes 2 Pro Llama 3 8B (q4f16_1)",
    model: "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Mistral"
  },
  {
    id: "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
    name: "Hermes 2 Pro Llama 3 8B (q4f32_1)",
    model: "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Mistral"
  },
  // Phi
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi 3.5 mini instruct (q4f16_1)",
    model: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3.5-mini-instruct-q4f32_1-MLC",
    name: "Phi 3.5 mini instruct (q4f32_1)",
    model: "Phi-3.5-mini-instruct-q4f32_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
    name: "Phi 3.5 mini instruct (q4f16_1-1k)",
    model: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3.5-mini-instruct-q4f32_1-MLC-1k",
    name: "Phi 3.5 mini instruct (q4f32_1-1k)",
    model: "Phi-3.5-mini-instruct-q4f32_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  // Mistral
  {
    id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    name: "Mistral 7B Instruct v0.3 (q4f16_1)",
    model: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    provider: "Mistral AI",
    family: "Mistral",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Mistral"
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
    name: "Mistral 7B Instruct v0.3 (q4f32_1)",
    model: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
    provider: "Mistral AI",
    family: "Mistral",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Mistral"
  },
  {
    id: "Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
    name: "Mistral 7B Instruct v0.2 (q4f16_1)",
    model: "Mistral-7B-Instruct-v0.2-q4f16_1-MLC",
    provider: "Mistral AI",
    family: "Mistral",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Mistral"
  },
  {
    id: "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC",
    name: "OpenHermes 2.5 Mistral 7B (q4f16_1)",
    model: "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC",
    provider: "NousResearch",
    family: "Mistral",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Mistral"
  },
  {
    id: "NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC",
    name: "NeuralHermes 2.5 Mistral 7B (q4f16_1)",
    model: "NeuralHermes-2.5-Mistral-7B-q4f16_1-MLC",
    provider: "Maxime Labonne",
    family: "Mistral",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Mistral"
  },
  // WizardMath
  {
    id: "WizardMath-7B-V1.1-q4f16_1-MLC",
    name: "WizardMath 7B V1.1 (q4f16_1)",
    model: "WizardMath-7B-V1.1-q4f16_1-MLC",
    provider: "WizardLM",
    family: "WizardMath",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "WizardLM"
  },
  // SmolLM2
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B Instruct (q4f16_1)",
    model: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f32_1-MLC",
    name: "SmolLM2 1.7B Instruct (q4f32_1)",
    model: "SmolLM2-1.7B-Instruct-q4f32_1-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-360M-Instruct-q0f16-MLC",
    name: "SmolLM2 360M Instruct (q0f16)",
    model: "SmolLM2-360M-Instruct-q0f16-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-360M-Instruct-q0f32-MLC",
    name: "SmolLM2 360M Instruct (q0f32)",
    model: "SmolLM2-360M-Instruct-q0f32-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M Instruct (q4f16_1)",
    model: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    name: "SmolLM2 360M Instruct (q4f32_1)",
    model: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    name: "SmolLM2 135M Instruct (q0f16)",
    model: "SmolLM2-135M-Instruct-q0f16-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  {
    id: "SmolLM2-135M-Instruct-q0f32-MLC",
    name: "SmolLM2 135M Instruct (q0f32)",
    model: "SmolLM2-135M-Instruct-q0f32-MLC",
    provider: "HuggingFaceTB",
    family: "SmolLM",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "SmolLM"
  },
  // Qwen3
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    name: "Qwen3 0.6B (q4f16_1)",
    model: "Qwen3-0.6B-q4f16_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-0.6B-q4f32_1-MLC",
    name: "Qwen3 0.6B (q4f32_1)",
    model: "Qwen3-0.6B-q4f32_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-0.6B-q0f16-MLC",
    name: "Qwen3 0.6B (q0f16)",
    model: "Qwen3-0.6B-q0f16-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-0.6B-q0f32-MLC",
    name: "Qwen3 0.6B (q0f32)",
    model: "Qwen3-0.6B-q0f32-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-1.7B-q4f16_1-MLC",
    name: "Qwen3 1.7B (q4f16_1)",
    model: "Qwen3-1.7B-q4f16_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-1.7B-q4f32_1-MLC",
    name: "Qwen3 1.7B (q4f32_1)",
    model: "Qwen3-1.7B-q4f32_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-4B-q4f16_1-MLC",
    name: "Qwen3 4B (q4f16_1)",
    model: "Qwen3-4B-q4f16_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-4B-q4f32_1-MLC",
    name: "Qwen3 4B (q4f32_1)",
    model: "Qwen3-4B-q4f32_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-8B-q4f16_1-MLC",
    name: "Qwen3 8B (q4f16_1)",
    model: "Qwen3-8B-q4f16_1-MLC",
    ...qwen3_common_configs,
  },
  {
    id: "Qwen3-8B-q4f32_1-MLC",
    name: "Qwen3 8B (q4f32_1)",
    model: "Qwen3-8B-q4f32_1-MLC",
    ...qwen3_common_configs,
  },
  // Qwen2.5
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 0.5B Instruct (q4f16_1)",
    model: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 0.5B Instruct (q4f32_1)",
    model: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q0f16-MLC",
    name: "Qwen2.5 0.5B Instruct (q0f16)",
    model: "Qwen2.5-0.5B-Instruct-q0f16-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q0f32-MLC",
    name: "Qwen2.5 0.5B Instruct (q0f32)",
    model: "Qwen2.5-0.5B-Instruct-q0f32-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B Instruct (q4f16_1)",
    model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 1.5B Instruct (q4f32_1)",
    model: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 3B Instruct (q4f16_1)",
    model: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 3B Instruct (q4f32_1)",
    model: "Qwen2.5-3B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 7B Instruct (q4f16_1)",
    model: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 7B Instruct (q4f32_1)",
    model: "Qwen2.5-7B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  // Qwen2.5-Coder
  {
    id: "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 Coder 0.5B Instruct (q4f16_1)",
    model: "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 Coder 0.5B Instruct (q4f32_1)",
    model: "Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-0.5B-Instruct-q0f16-MLC",
    name: "Qwen2.5 Coder 0.5B Instruct (q0f16)",
    model: "Qwen2.5-Coder-0.5B-Instruct-q0f16-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-0.5B-Instruct-q0f32-MLC",
    name: "Qwen2.5 Coder 0.5B Instruct (q0f32)",
    model: "Qwen2.5-Coder-0.5B-Instruct-q0f32-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 Coder 1.5B Instruct (q4f16_1)",
    model: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 Coder 1.5B Instruct (q4f32_1)",
    model: "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 Coder 3B Instruct (q4f16_1)",
    model: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 Coder 3B Instruct (q4f32_1)",
    model: "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 Coder 7B Instruct (q4f16_1)",
    model: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
    name: "Qwen2.5 Coder 7B Instruct (q4f32_1)",
    model: "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Qwen"
  },
  // Qwen2-Math
  {
    id: "Qwen2-Math-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2 Math 1.5B Instruct (q4f16_1)",
    model: "Qwen2-Math-1.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-Math-1.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2 Math 1.5B Instruct (q4f32_1)",
    model: "Qwen2-Math-1.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-Math-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2 Math 7B Instruct (q4f16_1)",
    model: "Qwen2-Math-7B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-Math-7B-Instruct-q4f32_1-MLC",
    name: "Qwen2 Math 7B Instruct (q4f32_1)",
    model: "Qwen2-Math-7B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  // Gemma 2
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    name: "gemma 2 2b it (q4f16_1)",
    model: "gemma-2-2b-it-q4f16_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "gemma 2 2b it (q4f32_1)",
    model: "gemma-2-2b-it-q4f32_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC-1k",
    name: "gemma 2 2b it (q4f16_1-1k)",
    model: "gemma-2-2b-it-q4f16_1-MLC-1k",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-2b-it-q4f32_1-MLC-1k",
    name: "gemma 2 2b it (q4f32_1-1k)",
    model: "gemma-2-2b-it-q4f32_1-MLC-1k",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-9b-it-q4f16_1-MLC",
    name: "gemma 2 9b it (q4f16_1)",
    model: "gemma-2-9b-it-q4f16_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-9b-it-q4f32_1-MLC",
    name: "gemma 2 9b it (q4f32_1)",
    model: "gemma-2-9b-it-q4f32_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.95
    },
    icon: "Google"
  },
  {
    id: "gemma-2-2b-jpn-it-q4f16_1-MLC",
    name: "gemma 2 2b jpn it (q4f16_1)",
    model: "gemma-2-2b-jpn-it-q4f16_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.9
    },
    icon: "Google"
  },
  {
    id: "gemma-2-2b-jpn-it-q4f32_1-MLC",
    name: "gemma 2 2b jpn it (q4f32_1)",
    model: "gemma-2-2b-jpn-it-q4f32_1-MLC",
    provider: "Google",
    family: "Gemma",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 1,
      top_p: 0.9
    },
    icon: "Google"
  },
  // StableLM
  {
    id: "stablelm-2-zephyr-1_6b-q4f16_1-MLC",
    name: "stablelm 2 zephyr 1_6b (q4f16_1)",
    model: "stablelm-2-zephyr-1_6b-q4f16_1-MLC",
    provider: "Hugging Face",
    family: "StableLM",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "StableLM"
  },
  {
    id: "stablelm-2-zephyr-1_6b-q4f32_1-MLC",
    name: "stablelm 2 zephyr 1_6b (q4f32_1)",
    model: "stablelm-2-zephyr-1_6b-q4f32_1-MLC",
    provider: "Hugging Face",
    family: "StableLM",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "StableLM"
  },
  {
    id: "stablelm-2-zephyr-1_6b-q4f16_1-MLC-1k",
    name: "stablelm 2 zephyr 1_6b (q4f16_1-1k)",
    model: "stablelm-2-zephyr-1_6b-q4f16_1-MLC-1k",
    provider: "Hugging Face",
    family: "StableLM",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "StableLM"
  },
  {
    id: "stablelm-2-zephyr-1_6b-q4f32_1-MLC-1k",
    name: "stablelm 2 zephyr 1_6b (q4f32_1-1k)",
    model: "stablelm-2-zephyr-1_6b-q4f32_1-MLC-1k",
    provider: "Hugging Face",
    family: "StableLM",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "StableLM"
  },
  // RedPajama
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
    name: "RedPajama INCITE Chat 3B v1 (q4f16_1)",
    model: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
    provider: "Together",
    family: "RedPajama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "RedPajama"
  },
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
    name: "RedPajama INCITE Chat 3B v1 (q4f32_1)",
    model: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC",
    provider: "Together",
    family: "RedPajama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "RedPajama"
  },
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC-1k",
    name: "RedPajama INCITE Chat 3B v1 (q4f16_1-1k)",
    model: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC-1k",
    provider: "Together",
    family: "RedPajama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "RedPajama"
  },
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC-1k",
    name: "RedPajama INCITE Chat 3B v1 (q4f32_1-1k)",
    model: "RedPajama-INCITE-Chat-3B-v1-q4f32_1-MLC-1k",
    provider: "Together",
    family: "RedPajama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "RedPajama"
  },
  // TinyLlama
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama 1.1B Chat v1.0 (q4f16_1)",
    model: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
    name: "TinyLlama 1.1B Chat v1.0 (q4f32_1)",
    model: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
    name: "TinyLlama 1.1B Chat v1.0 (q4f16_1-1k)",
    model: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
    name: "TinyLlama 1.1B Chat v1.0 (q4f32_1-1k)",
    model: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC-1k",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Meta"
  },
  // Older models
  {
    id: "Llama-3.1-70B-Instruct-q3f16_1-MLC",
    name: "Llama 3.1 70B Instruct (q3f16_1)",
    model: "Llama-3.1-70B-Instruct-q3f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2 0.5B Instruct (q4f16_1)",
    model: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-0.5B-Instruct-q0f16-MLC",
    name: "Qwen2 0.5B Instruct (q0f16)",
    model: "Qwen2-0.5B-Instruct-q0f16-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-0.5B-Instruct-q0f32-MLC",
    name: "Qwen2 0.5B Instruct (q0f32)",
    model: "Qwen2-0.5B-Instruct-q0f32-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2 1.5B Instruct (q4f16_1)",
    model: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
    name: "Qwen2 1.5B Instruct (q4f32_1)",
    model: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2 7B Instruct (q4f16_1)",
    model: "Qwen2-7B-Instruct-q4f16_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Qwen2-7B-Instruct-q4f32_1-MLC",
    name: "Qwen2 7B Instruct (q4f32_1)",
    model: "Qwen2-7B-Instruct-q4f32_1-MLC",
    provider: "Alibaba",
    family: "Qwen",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.8
    },
    icon: "Qwen"
  },
  {
    id: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
    name: "Llama 3 8B Instruct (q4f32_1-1k)",
    model: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3-8B-Instruct-q4f16_1-MLC-1k",
    name: "Llama 3 8B Instruct (q4f16_1-1k)",
    model: "Llama-3-8B-Instruct-q4f16_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3 8B Instruct (q4f32_1)",
    model: "Llama-3-8B-Instruct-q4f32_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3 8B Instruct (q4f16_1)",
    model: "Llama-3-8B-Instruct-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-3-70B-Instruct-q3f16_1-MLC",
    name: "Llama 3 70B Instruct (q3f16_1)",
    model: "Llama-3-70B-Instruct-q3f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 0.95
    },
    icon: "Meta"
  },
  // Phi3-mini-instruct
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi 3 mini 4k instruct (q4f16_1)",
    model: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f32_1-MLC",
    name: "Phi 3 mini 4k instruct (q4f32_1)",
    model: "Phi-3-mini-4k-instruct-q4f32_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC-1k",
    name: "Phi 3 mini 4k instruct (q4f16_1-1k)",
    model: "Phi-3-mini-4k-instruct-q4f16_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f32_1-MLC-1k",
    name: "Phi 3 mini 4k instruct (q4f32_1-1k)",
    model: "Phi-3-mini-4k-instruct-q4f32_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    },
    icon: "Microsoft"
  },
  {
    id: "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
    name: "Llama 2 7b chat hf (q4f32_1-1k)",
    model: "Llama-2-7b-chat-hf-q4f32_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-2-7b-chat-hf-q4f16_1-MLC-1k",
    name: "Llama 2 7b chat hf (q4f16_1-1k)",
    model: "Llama-2-7b-chat-hf-q4f16_1-MLC-1k",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-2-7b-chat-hf-q4f32_1-MLC",
    name: "Llama 2 7b chat hf (q4f32_1)",
    model: "Llama-2-7b-chat-hf-q4f32_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    name: "Llama 2 7b chat hf (q4f16_1)",
    model: "Llama-2-7b-chat-hf-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "Llama-2-13b-chat-hf-q4f16_1-MLC",
    name: "Llama 2 13b chat hf (q4f16_1)",
    model: "Llama-2-13b-chat-hf-q4f16_1-MLC",
    provider: "Meta",
    family: "Llama",
    recommended_config: {
      temperature: 0.6,
      top_p: 0.9
    },
    icon: "Meta"
  },
  {
    id: "phi-2-q4f16_1-MLC",
    name: "phi 2 (q4f16_1)",
    model: "phi-2-q4f16_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-2-q4f32_1-MLC",
    name: "phi 2 (q4f32_1)",
    model: "phi-2-q4f32_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-2-q4f16_1-MLC-1k",
    name: "phi 2 (q4f16_1-1k)",
    model: "phi-2-q4f16_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-2-q4f32_1-MLC-1k",
    name: "phi 2 (q4f32_1-1k)",
    model: "phi-2-q4f32_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-1_5-q4f16_1-MLC",
    name: "phi 1_5 (q4f16_1)",
    model: "phi-1_5-q4f16_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-1_5-q4f32_1-MLC",
    name: "phi 1_5 (q4f32_1)",
    model: "phi-1_5-q4f32_1-MLC",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-1_5-q4f16_1-MLC-1k",
    name: "phi 1_5 (q4f16_1-1k)",
    model: "phi-1_5-q4f16_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "phi-1_5-q4f32_1-MLC-1k",
    name: "phi 1_5 (q4f32_1-1k)",
    model: "phi-1_5-q4f32_1-MLC-1k",
    provider: "Microsoft",
    family: "Phi",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Microsoft"
  },
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
    name: "TinyLlama 1.1B Chat v0.4 (q4f16_1)",
    model: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
    name: "TinyLlama 1.1B Chat v0.4 (q4f32_1)",
    model: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k",
    name: "TinyLlama 1.1B Chat v0.4 (q4f16_1-1k)",
    model: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Meta"
  },
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
    name: "TinyLlama 1.1B Chat v0.4 (q4f32_1-1k)",
    model: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
    provider: "Zhang Peiyuan",
    family: "Llama",
    recommended_config: {
      temperature: 0.7,
      top_p: 0.95
    },
    icon: "Meta"
  }
]
