"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Wand2, 
  Eye, 
  Volume2,
  FileText,
  Palette,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Maximize,
  Square,
  Smartphone,
  Monitor
} from "lucide-react"
import Image from "next/image"
import { fetchFile } from "@ffmpeg/util"
import type { ProgressInfo } from "@huggingface/transformers"

function useTypewriter(text: string, enabled: boolean, speed: number = 50) {
  const [displayText, setDisplayText] = useState("")

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayText(text || "")
      return
    }

    setDisplayText("")
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, enabled, speed])

  return displayText
}

function formatTimestamp(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0")
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
  const s = Math.floor(seconds % 60).toString().padStart(2, "0")
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0")
  return `${h}:${m}:${s}.${ms}`
}

function groupWords(
  chunks: any[], 
  maxWordsPerLine: number = 4, 
  maxDuration: number = 4
): any[] {
  if (!chunks || chunks.length === 0) return []

  const lines: any[] = []
  let currentLine: any[] = []

  chunks.forEach((word, index) => {
    const lineDuration = currentLine.length > 0
      ? word.timestamp[1] - currentLine[0].timestamp[0]
      : 0

    if (currentLine.length === 0) {
      currentLine.push(word)
    } else if (currentLine.length < maxWordsPerLine && lineDuration < maxDuration) {
      currentLine.push(word)
    } else {
      lines.push({
        text: currentLine.map(w => w.text).join("").trim(),
        timestamp: [currentLine[0].timestamp[0], currentLine[currentLine.length - 1].timestamp[1]],
        words: [...currentLine]
      })
      currentLine = [word]
    }

    if (index === chunks.length - 1) {
      lines.push({
        text: currentLine.map(w => w.text).join("").trim(),
        timestamp: [currentLine[0].timestamp[0], currentLine[currentLine.length - 1].timestamp[1]],
        words: [...currentLine]
      })
    }
  })
  
  return lines
}

function encodeWAV(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
  }

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, samples.length * 2, true)
  floatTo16BitPCM(view, 44, samples)

  return view
}

function hexToRgba(hex: string, opacity: number): string {
    let r = 0, g = 0, b = 0
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16)
        g = parseInt(hex[2] + hex[2], 16)
        b = parseInt(hex[3] + hex[3], 16)
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16)
        g = parseInt(hex.slice(3, 5), 16)
        b = parseInt(hex.slice(5, 7), 16)
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

type Voice = "af_heart" | "af_bella" | "af_nicole" | "am_michael" | "bf_emma" | "bm_george"

type VideoSize = {
  name: string
  width: number
  height: number
  aspectRatio: string
  icon: React.ComponentType<{ className?: string }>
}

type SubtitleStyle = {
  fontFamily: string
  fontSize: number
  fontWeight: string
  color: string
  textOpacity: number
  strokeWidth: number
  strokeColor: string
  position: 'top' | 'center' | 'bottom'
  animation: 'none' | 'fade' | 'slide' | 'pop' | 'typewriter'
  backgroundEnabled: boolean
  boxBorderWidth: number
  boxBorderColor: string
  boxPadding: number
}

type GenerationStep = {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
}

const VIDEO_SIZES: VideoSize[] = [
  { name: "9:16 (Shorts)", width: 1080, height: 1920, aspectRatio: "9:16", icon: Smartphone },
  { name: "16:9 (Landscape)", width: 1920, height: 1080, aspectRatio: "16:9", icon: Monitor },
  { name: "1:1 (Square)", width: 1080, height: 1080, aspectRatio: "1:1", icon: Square },
  { name: "4:5 (Instagram)", width: 1080, height: 1350, aspectRatio: "4:5", icon: Maximize },
]

const VOICE_OPTIONS = [
  { value: "af_heart", label: "Sarah (American Female)", accent: "🇺🇸", tone: "Warm & Friendly" },
  { value: "af_bella", label: "Bella (American Female)", accent: "🇺🇸", tone: "Professional & Clear" },
  { value: "af_nicole", label: "Nicole (American Female)", accent: "🇺🇸", tone: "Energetic & Youthful" },
  { value: "am_michael", label: "Michael (American Male)", accent: "🇺🇸", tone: "Deep & Authoritative" },
  { value: "bf_emma", label: "Emma (British Female)", accent: "🇬🇧", tone: "Elegant & Sophisticated" },
  { value: "bm_george", label: "George (British Male)", accent: "🇬🇧", tone: "Refined & Distinguished" },
]

const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Tiempos Text Regular, sans-serif',
  fontSize: 32,
  fontWeight: 'bold',
  color: '#FFFFFF',
  textOpacity: 1,
  strokeWidth: 1.2,
  strokeColor: '#000000',
  position: 'center',
  animation: 'fade',
  backgroundEnabled: false,
  boxBorderWidth: 1.2,
  boxBorderColor: '#FFFFFF',
  boxPadding: 4,
}

const splitSentences = (text: string): string[] => {
  if (!text) return []
  // Split by sentences, keeping the delimiter. Also splits by newlines.
  const sentences = text.match(/[^.!?\n]+([.!?\n]|$)/g) || []
  return sentences.map(s => s.trim()).filter(s => s.length > 0)
}

function alignTranscription(originalScript: string, transcribedChunks: any[]): any[] {
    const originalWords = originalScript.split(/\s+/).filter(Boolean);
    const transcribedWordsInfo = transcribedChunks.map(chunk => ({
        ...chunk,
        word: chunk.text.trim(),
    }));

    const n = originalWords.length;
    const m = transcribedWordsInfo.length;

    if (n === 0 || m === 0) return [];

    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    const pointers = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0)); // 0: diag, 1: up, 2: left

    const normalize = (word: string) => word.toLowerCase().replace(/[.,!?""'"`]/g, '');

    const matchScore = 2;
    const mismatchPenalty = -1;
    const gapPenalty = -1;

    for (let i = 1; i <= n; i++) {
        dp[i][0] = i * gapPenalty;
        pointers[i][0] = 1;
    }
    for (let j = 1; j <= m; j++) {
        dp[0][j] = j * gapPenalty;
        pointers[0][j] = 2;
    }

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const score = normalize(originalWords[i - 1]) === normalize(transcribedWordsInfo[j - 1].word) ? matchScore : mismatchPenalty;
            const diagScore = dp[i - 1][j - 1] + score;
            const upScore = dp[i - 1][j] + gapPenalty;
            const leftScore = dp[i][j - 1] + gapPenalty;

            if (diagScore >= upScore && diagScore >= leftScore) {
                dp[i][j] = diagScore;
                pointers[i][j] = 0;
            } else if (upScore >= leftScore) {
                dp[i][j] = upScore;
                pointers[i][j] = 1;
            } else {
                dp[i][j] = leftScore;
                pointers[i][j] = 2;
            }
        }
    }

    const alignedChunks = [];
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
        const pointer = pointers[i][j];
        if (pointer === 0) {
            alignedChunks.unshift({
                ...transcribedWordsInfo[j - 1],
                text: ` ${originalWords[i - 1]}`,
            });
            i--;
            j--;
        } else if (pointer === 1) {
            i--;
        } else {
            j--;
        }
    }

    return alignedChunks;
}

export function ReelGenerator() {
  const calculateEstimatedDuration = (text: string): number => {
    const WORDS_PER_SECOND = 2.5
    if (!text || text.trim() === '') {
      return 0
    }
    const wordCount = text.trim().split(/\s+/).length
    return Math.ceil(wordCount / WORDS_PER_SECOND)
  }

  const [script, setScript] = useState("Transform your ideas into captivating stories that resonate with millions. Every word matters, every frame counts.")
  const [voice, setVoice] = useState<Voice>("af_heart")
  const [backgroundVideo, setBackgroundVideo] = useState<File | null>(null)
  const [videoSize, setVideoSize] = useState<VideoSize>(VIDEO_SIZES[0])
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: 'audio', name: 'Generating Audio', status: 'pending', progress: 0 },
    { id: 'subtitles', name: 'Creating Subtitles', status: 'pending', progress: 0 },
    { id: 'processing', name: 'Processing Video', status: 'pending', progress: 0 },
    { id: 'finalizing', name: 'Finalizing Reel', status: 'pending', progress: 0 },
  ])
  
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [subtitles, setSubtitles] = useState<any[] | null>(null)
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null)
  const [vttUrl, setVttUrl] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const [activeSubtitleChunk, setActiveSubtitleChunk] = useState<any | null>(null)
  const [activeWord, setActiveWord] = useState<any | null>(null)
  
  const [activeTab, setActiveTab] = useState("script")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoPreviewRef = useRef<HTMLDivElement>(null)
  const ttsRef = useRef<any>(null)
  const transcriberRef = useRef<any>(null)

  const [videoPlayerSize, setVideoPlayerSize] = useState({ width: 0, height: 0 })

  const updateGenerationStep = useCallback((stepId: string, status: GenerationStep['status'], progress: number) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, progress } : step
    ))
  }, [])

  const resetGenerationSteps = useCallback(() => {
    setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0 })))
  }, [])

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBackgroundVideo(file)
      setBackgroundVideoUrl(URL.createObjectURL(file))
    }
  }, [])

  const generateAdvancedVTT = useCallback((chunks: any[], style: SubtitleStyle) => {
    let vtt = "WEBVTT\n\n"
    vtt += "STYLE\n"
    vtt += "::cue {\n"
    vtt += `  font-family: ${style.fontFamily};\n`
    vtt += `  font-size: ${style.fontSize}px;\n`
    vtt += `  font-weight: ${style.fontWeight};\n`
    vtt += `  color: ${style.color};\n`
    vtt += `  text-stroke: ${style.strokeWidth}px ${style.strokeColor};\n`
    vtt += "  background-color: transparent;\n"
    vtt += "  text-align: center;\n"
    vtt += "  white-space: pre-line;\n"
    vtt += "}\n\n"
    
    chunks.forEach((chunk, index) => {
      const [start, end] = chunk.timestamp
      vtt += `${index + 1}\n`
      vtt += `${formatTimestamp(start)} --> ${formatTimestamp(end)}\n`
      
      const words = chunk.text.trim().split(' ')
      const emphasizedText = words.map((word: string, i: number) => {
        if (i === Math.floor(words.length / 2)) {
          return `<b>${word}</b>`
        }
        return word
      }).join(' ')
      
      vtt += `${emphasizedText}\n\n`
    })
    
    return vtt
  }, [])

  const generateReel = async () => {
    if (!script) return

    setIsGenerating(true)
    setGeneratedAudioUrl(null)
    setSubtitles(null)
    setFinalVideoUrl(null)
    resetGenerationSteps()

    let ffmpeg: any = null

    try {
      updateGenerationStep('audio', 'processing', 10)

      if (!ttsRef.current) {
        const { KokoroTTS } = await import('kokoro-js')
        ttsRef.current = await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-v1.0-ONNX",
          {
            device: "webgpu",
            dtype: "fp32",
            progress_callback: (progressInfo: ProgressInfo) => {
              if (progressInfo.status === 'progress') {
                const modelLoadProgress = progressInfo.progress * 0.7 // 0-70%
                updateGenerationStep('audio', 'processing', 10 + modelLoadProgress)
              }
            }
          }
        )
      }
      const tts = ttsRef.current
      
      // Chunk the script into sentences to handle long inputs
      const sentences = splitSentences(script)
      if (sentences.length === 0) throw new Error("Script is empty or could not be processed.")

      const audioChunks: Float32Array[] = []
      let sampleRate = 24000

      const generationStartProgress = 80
      const generationTotalProgress = 15 // 80% -> 95%

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i]
        const raw = await tts.generate(sentence, { voice: voice })
        audioChunks.push(raw.audio)
        sampleRate = raw.sampling_rate || 24000

        const progress = generationStartProgress + (generationTotalProgress * (i + 1) / sentences.length)
        updateGenerationStep('audio', 'processing', progress)
      }
      
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const result = new Float32Array(totalLength)
      let offset = 0
      for (const chunk of audioChunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }

      const wav = encodeWAV(result, sampleRate)
      const blob = new Blob([wav], { type: "audio/wav" })
      const audioUrl = URL.createObjectURL(blob)
      setGeneratedAudioUrl(audioUrl)
      
      updateGenerationStep('audio', 'completed', 100)

      updateGenerationStep('subtitles', 'processing', 90)

      if (!transcriberRef.current) {
        const { pipeline } = await import('@huggingface/transformers')
        transcriberRef.current = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-small",
          {
            dtype: 'fp32',
            device: 'webgpu',
            progress_callback: (progressInfo: ProgressInfo) => {
              if ('status' in progressInfo && progressInfo.status === 'progress') {
                const progress = 10 + (progressInfo.progress * 0.8)
                updateGenerationStep('subtitles', 'processing', progress)
              }
            }
          }
        )
      }
      const transcriber = transcriberRef.current
      
      const output = await transcriber(audioUrl, {
        return_timestamps: "word",
        chunk_length_s: 30,
        stride_length_s: 5,
      })
      
      const chunks = Array.isArray(output) 
        ? output[0].chunks 
        : (output.chunks || [])
      
      const safeChunks = chunks || []
      
      updateGenerationStep('subtitles', 'processing', 98)
      await new Promise(resolve => setTimeout(resolve, 50))

      const alignedChunks = alignTranscription(script, safeChunks)
      const sentenceChunks = groupWords(alignedChunks)
      setSubtitles(sentenceChunks)

      const vttContent = generateAdvancedVTT(sentenceChunks, subtitleStyle)
      const vttBlob = new Blob([vttContent], { type: "text/vtt" })
      setVttUrl(URL.createObjectURL(vttBlob))
      
      updateGenerationStep('subtitles', 'completed', 100)

      updateGenerationStep('processing', 'processing', 0)
      if (backgroundVideo) {
        const baseURLFFMPEG = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd'
        const baseURLCore = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        
        const ffmpegBlobURL = await toBlobURLPatched(
          `${baseURLFFMPEG}/ffmpeg.js`,
          'text/javascript',
          (js) => js.replace('new URL(e.p+e.u(814),e.b)', 'r.worker814URL')
        )
        
        await loadScript(ffmpegBlobURL)
        
        ffmpeg = new (window as any).FFmpegWASM.FFmpeg()

        ffmpeg.on('log', ({ message }: { message: string }) => console.log(message))
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          updateGenerationStep('processing', 'processing', Math.round(progress * 100))
        })
        
        const config = {
            worker814URL: await toBlobURL(`${baseURLFFMPEG}/814.ffmpeg.js`, 'text/javascript'),
            coreURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.wasm`, 'application/wasm'),
        }
        await ffmpeg.load(config)
        
        updateGenerationStep('processing', 'processing', 10)

        await ffmpeg.createDir('/fonts')
        const font = await fetchFile('https://db.onlinewebfonts.com/t/1b3f9cb78376a36884f3908f37a42c91.ttf')
        await ffmpeg.writeFile('/fonts/Tiempos-Regular.ttf', font)

        await ffmpeg.writeFile('input.mp4', await fetchFile(backgroundVideo))
        await ffmpeg.writeFile('audio.wav', await fetchFile(blob))
        
        const assContent = generateASS(sentenceChunks, subtitleStyle, videoSize)
        await ffmpeg.writeFile('subs.ass', assContent)

        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-i', 'audio.wav',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-vf', `subtitles=subs.ass:fontsdir=/fonts`,
          '-preset', 'ultrafast',
          '-shortest',
          'output.mp4'
        ])
        
        const data = await ffmpeg.readFile('output.mp4')
        const finalBlob = new Blob([data], { type: 'video/mp4' })
        setFinalVideoUrl(URL.createObjectURL(finalBlob))
      }
      
      updateGenerationStep('processing', 'completed', 100)

      updateGenerationStep('finalizing', 'processing', 80)
      await new Promise(resolve => setTimeout(resolve, 300))
      updateGenerationStep('finalizing', 'completed', 100)

    } catch (error) {
      console.error("Error generating reel:", error)
      setGenerationSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ))
    } finally {
      if (ffmpeg) {
        try {
          await ffmpeg.terminate()
        } catch (e) {
          console.error("Failed to terminate ffmpeg", e)
        }
      }
      setIsGenerating(false)
    }
  }

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      videoRef.current?.pause()
      audioRef.current?.pause()
    } else {
      videoRef.current?.play()
      audioRef.current?.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const downloadReel = useCallback(() => {
    const url = finalVideoUrl || generatedAudioUrl
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = finalVideoUrl ? 'generated-reel.mp4' : 'generated-reel-audio.wav'
      a.click()
    }
  }, [finalVideoUrl, generatedAudioUrl])

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }

  const nextTab = () => {
    const tabs = ["script", "voice", "background", "style", "generate"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const canProceed = {
    script: script.trim().length > 0,
    voice: true,
    background: backgroundVideo !== null,
    style: true,
    generate: script.trim().length > 0
  }

  const getSubtitleContainerStyle = (style: SubtitleStyle): React.CSSProperties => {
    const positionStyles: { [key in SubtitleStyle['position']]: React.CSSProperties } = {
      top: { top: '10%' },
      center: { top: '50%', transform: 'translate(-50%, -50%)' },
      bottom: { bottom: '10%' },
    }
    return {
      position: 'absolute',
      left: '50%',
      width: '90%',
      textAlign: 'center',
      pointerEvents: 'none',
      transform: style.position === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)',
      ...positionStyles[style.position],
    }
  }

  const getSubtitleTextStyle = (style: SubtitleStyle): React.CSSProperties => ({
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: hexToRgba(style.color, style.textOpacity),
    WebkitTextStroke: style.backgroundEnabled ? 'none' : `${style.strokeWidth}px ${style.strokeColor}`,
    paintOrder: 'stroke fill',
    display: 'inline-block',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.2',
    textShadow: style.backgroundEnabled ? 'none' : `1px 1px 2px #000000cc`,
    backgroundColor: 'transparent',
    padding: '0',
    borderRadius: '0',
    border: 'none',
    transition: 'color 0.2s ease, opacity 0.2s ease',
  })

  const isTypewriterEffect = subtitleStyle.animation === 'typewriter'
  const typewriterText = useTypewriter(
    activeSubtitleChunk?.text || "",
    isTypewriterEffect,
    30
  )

  const getScaledSubtitleStyle = (style: SubtitleStyle): React.CSSProperties => {
    const scale = videoPlayerSize.width / videoSize.width
    if (isNaN(scale) || scale <= 0) return getSubtitleTextStyle(style)

    return {
      ...getSubtitleTextStyle(style),
      fontSize: `${style.fontSize * scale}px`,
      padding: style.backgroundEnabled ? `${style.boxPadding * scale}px` : '0',
      border: style.backgroundEnabled ? `${style.boxBorderWidth * scale}px solid ${style.boxBorderColor}` : 'none',
      WebkitTextStroke: style.backgroundEnabled ? 'none' : `${style.strokeWidth * scale}px ${style.strokeColor}`,
    }
  }

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect
        setVideoPlayerSize({ width, height })
      }
    })
    if (videoPreviewRef.current) {
      observer.observe(videoPreviewRef.current)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/reelevate.png" alt="Reelevate Logo" className="text-primary" height={32} width={32} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Reelevate.AI
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Create professional-quality video reels with AI-powered voiceovers and dynamic subtitles
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2">
            {/* Progress Indicator */}
            {isGenerating && (
              <Card className="mb-6 border-zinc-700 bg-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-zinc-100">
                    <Zap className="w-5 h-5" />
                    Generating Your Reel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generationSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        {getStepIcon(step)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{step.name}</span>
                            <span className="text-xs text-zinc-400">{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-zinc-800 grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="script" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <FileText className="w-4 h-4" />
                  Script
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <Volume2 className="w-4 h-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="background" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <Upload className="w-4 h-4" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <Palette className="w-4 h-4" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="script">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Craft Your Script
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Write compelling content that captures attention. Aim for 15-60 seconds of narration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="script">Script Content</Label>
                        <Textarea
                          id="script"
                          placeholder="Write your engaging script here... Pro tip: Start with a hook, provide value, and end with a call to action."
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          rows={8}
                          className="mt-2 bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{script.length} characters</span>
                        <span>~{calculateEstimatedDuration(script)} seconds</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={nextTab} 
                      disabled={!canProceed.script}
                      className="ml-auto bg-white text-black hover:bg-white/90"
                    >
                      Next: Choose Voice
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="voice">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Select Voice Character
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Choose the perfect voice to bring your story to life.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {VOICE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            voice === option.value
                              ? 'border-zinc-500 bg-zinc-700/50 ring-2 ring-zinc-500'
                              : 'border-zinc-700 hover:border-zinc-500'
                          }`}
                          onClick={() => setVoice(option.value as Voice)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xl">{option.accent}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {option.tone}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={nextTab} className="ml-auto bg-white text-black hover:bg-white/90">
                      Next: Upload Media
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="background">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Background Media
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Upload your background video to create the perfect visual story.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="video-size">Video Size & Format</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {VIDEO_SIZES.map((size) => (
                            <div
                              key={size.name}
                              className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                                videoSize.name === size.name
                                  ? 'border-zinc-500 bg-zinc-700/50 ring-2 ring-zinc-500'
                                  : 'border-zinc-700 hover:border-zinc-500'
                              }`}
                              onClick={() => setVideoSize(size)}
                            >
                              <size.icon className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                              <div className="text-sm font-medium">{size.aspectRatio}</div>
                              <div className="text-xs text-zinc-400">{size.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="background-video">Upload Video</Label>
                        <div className="mt-2 border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors">
                          <Upload className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
                          <Input
                            id="background-video"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="bg-black max-w-xs mx-auto"
                          />
                          <p className="text-sm text-zinc-400 mt-2">
                            Supports MP4, MOV, AVI files
                          </p>
                        </div>
                        {backgroundVideo && (
                          <div className="mt-4 p-3 bg-zinc-700/50 border border-zinc-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-zinc-300">
                                {backgroundVideo.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={nextTab} 
                      disabled={!canProceed.background}
                      className="ml-auto bg-white text-black hover:bg-white/90"
                    >
                      Next: Customize Style
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="style">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Subtitle Styling
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Customize how your subtitles look to match your brand.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Font Size</Label>
                          <Slider
                            value={[subtitleStyle.fontSize]}
                            onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, fontSize: value }))}
                            min={16}
                            max={48}
                            step={2}
                            className="mt-2"
                          />
                          <div className="text-sm text-zinc-400 mt-1">{subtitleStyle.fontSize}px</div>
                        </div>
                        
                        <div>
                          <Label>Position</Label>
                          <Select
                            value={subtitleStyle.position}
                            onValueChange={(value: 'top' | 'center' | 'bottom') => 
                              setSubtitleStyle(prev => ({ ...prev, position: value }))
                            }
                          >
                            <SelectTrigger className="mt-2 bg-zinc-700 border-zinc-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectItem value="top" className="focus:bg-zinc-700">Top</SelectItem>
                              <SelectItem value="center" className="focus:bg-zinc-700">Center</SelectItem>
                              <SelectItem value="bottom" className="focus:bg-zinc-700">Bottom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Animation Style</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                          {['none', 'fade', 'slide', 'pop', 'typewriter'].map((animation) => (
                            <Button
                              key={animation}
                              variant="outline"
                              size="sm"
                              onClick={() => setSubtitleStyle(prev => ({ 
                                ...prev, 
                                animation: animation as SubtitleStyle['animation'] 
                              }))}
                              className={`capitalize w-full ${
                                subtitleStyle.animation === animation 
                                ? 'bg-white text-black hover:bg-white/90 hover:text-black' 
                                : 'border-zinc-700 hover:bg-zinc-700 bg-zinc-800'
                              }`}
                            >
                              {animation}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="advanced-options"
                          checked={showAdvancedOptions}
                          onCheckedChange={setShowAdvancedOptions}
                        />
                        <Label htmlFor="advanced-options">Show Advanced Options</Label>
                      </div>

                      {showAdvancedOptions && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-900 rounded-lg">
                          {!subtitleStyle.backgroundEnabled && (
                            <>
                              <div>
                                <Label>Text Stroke Color</Label>
                                <Input
                                  type="color"
                                  value={subtitleStyle.strokeColor}
                                  onChange={(e) => setSubtitleStyle(prev => ({ ...prev, strokeColor: e.target.value }))}
                                  className="mt-2 h-10 w-full bg-zinc-800"
                                />
                              </div>
                              <div>
                                <Label>Text Stroke Width</Label>
                                <Slider
                                  value={[subtitleStyle.strokeWidth]}
                                  onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, strokeWidth: value }))}
                                  min={0} max={8} step={0.5}
                                  className="mt-2"
                                />
                              </div>
                            </>
                          )}
                          <div>
                            <Label>Text Color</Label>
                            <Input
                              type="color"
                              value={subtitleStyle.color}
                              onChange={(e) => setSubtitleStyle(prev => ({ ...prev, color: e.target.value }))}
                              className="mt-2 h-10 w-full bg-zinc-800"
                            />
                          </div>
                          <div>
                            <Label>Text Opacity</Label>
                            <Slider
                              value={[subtitleStyle.textOpacity]}
                              onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, textOpacity: value }))}
                              min={0} max={1} step={0.1}
                              className="mt-2"
                            />
                          </div>
                          
                          <div className="col-span-2 flex items-center space-x-2 pt-4 border-t border-zinc-700 mt-4">
                            <Switch
                              id="background-enabled"
                              checked={subtitleStyle.backgroundEnabled}
                              onCheckedChange={(checked) => setSubtitleStyle(prev => ({ ...prev, backgroundEnabled: checked }))}
                            />
                            <Label htmlFor="background-enabled">Enable Subtitle Box</Label>
                          </div>
                          {subtitleStyle.backgroundEnabled && (
                            <>
                              <div>
                                <Label>Box Border Color</Label>
                                <Input
                                  type="color"
                                  value={subtitleStyle.boxBorderColor}
                                  onChange={(e) => setSubtitleStyle(prev => ({ ...prev, boxBorderColor: e.target.value }))}
                                  className="mt-2 h-10 w-full bg-zinc-800"
                                />
                              </div>
                              <div>
                                <Label>Box Border Width</Label>
                                <Slider
                                  value={[subtitleStyle.boxBorderWidth]}
                                  onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, boxBorderWidth: value }))}
                                  min={0} max={5} step={0.1}
                                  className="mt-2"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label>Box Padding</Label>
                                <Slider
                                  value={[subtitleStyle.boxPadding]}
                                  onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, boxPadding: value }))}
                                  min={0} max={24} step={2}
                                  className="mt-2"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={nextTab} className="ml-auto bg-white text-black hover:bg-white/90">
                      Next: Generate Reel
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="generate">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      Generate Your Reel
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Review your settings and create your professional reel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Script Length</span>
                            <Badge variant="secondary">{script.length} chars</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Voice</span>
                            <Badge variant="secondary">{VOICE_OPTIONS.find(v => v.value === voice)?.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Video Size</span>
                            <Badge variant="secondary">{videoSize.aspectRatio}</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Background</span>
                            <Badge variant={backgroundVideo ? "default" : "destructive"}>
                              {backgroundVideo ? "Uploaded" : "Missing"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Subtitle Style</span>
                            <Badge variant="secondary">{subtitleStyle.animation}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                            <span className="text-sm font-medium">Models</span>
                            <Badge variant={"default"}>
                              Ready
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("script")}
                      className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review Settings
                    </Button>
                    <Button
                      onClick={generateReel}
                      disabled={!canProceed.generate || isGenerating}
                      className="flex items-center gap-2 bg-white text-black hover:bg-white/90"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {isGenerating ? "Generating..." : "Generate Reel"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-1">
            <div className="sticky top-4">
              <Card className="mb-4 bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {finalVideoUrl ? "Final Video" : "Live Preview"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(previewMode === 'mobile' ? 'desktop' : 'mobile')}
                        className="border-zinc-700 hover:bg-zinc-700 bg-zinc-800"
                      >
                        {previewMode === 'mobile' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div ref={videoPreviewRef}>
                    {backgroundVideoUrl ? (
                      <div className={`relative mx-auto bg-black rounded-lg overflow-hidden ${
                        previewMode === 'mobile' ? 'aspect-[9/16] max-w-[200px]' : 'aspect-[16/9] w-full'
                      }`}>
                        <video
                          ref={videoRef}
                          src={finalVideoUrl || backgroundVideoUrl}
                          className="w-full h-full object-cover"
                          muted={!finalVideoUrl}
                          loop={!finalVideoUrl}
                          playsInline
                          controls={!!finalVideoUrl}
                          onTimeUpdate={(e) => {
                            if (finalVideoUrl) return
                            const time = e.currentTarget.currentTime
                            if (audioRef.current) {
                              audioRef.current.currentTime = time
                            }
                            if (subtitles) {
                              const activeChunk = (subtitles as any[]).find(
                                (chunk: any) => time >= chunk.timestamp[0] && time <= chunk.timestamp[1]
                              )
                              setActiveSubtitleChunk(activeChunk || null)
                              
                              if (activeChunk) {
                                const currentWord = activeChunk.words.find((word: any) => time >= word.timestamp[0] && time <= word.timestamp[1])
                                setActiveWord(currentWord || null)
                              } else {
                                setActiveWord(null)
                              }
                            }
                          }}
                        />
                        {!finalVideoUrl && generatedAudioUrl && (
                          <audio ref={audioRef} src={generatedAudioUrl} />
                        )}
                        
                        {/* Live Subtitle Overlay - only shows before final video is generated */}
                        {!finalVideoUrl && (
                          <div style={getSubtitleContainerStyle(subtitleStyle)}>
                            {activeSubtitleChunk ? (
                              <p 
                                key={activeSubtitleChunk.timestamp[0]}
                                style={getScaledSubtitleStyle(subtitleStyle)}
                                className={`
                                  ${!isTypewriterEffect ? `animate-${subtitleStyle.animation}` : ''}
                                  ${subtitleStyle.backgroundEnabled ? 'flex flex-wrap justify-center items-center' : ''}
                                `}
                              >
                                {isTypewriterEffect ? typewriterText : activeSubtitleChunk.words.map((word: any, index: number) => {
                                  const isActive = activeWord && activeWord.timestamp[0] === word.timestamp[0]
                                  const scale = videoPlayerSize.width / videoSize.width
                                  const scaledPadding = (subtitleStyle.boxPadding || 0) * scale
                                  const scaledBorderWidth = (subtitleStyle.boxBorderWidth || 0) * scale

                                  const wordStyle: React.CSSProperties = {
                                    transition: 'opacity 0.2s ease',
                                    opacity: isActive ? 1 : 0.7,
                                    display: 'inline-block',
                                    margin: '0 0.08em',
                                  }

                                  if (subtitleStyle.backgroundEnabled) {
                                    wordStyle.padding = `${scaledPadding}px`
                                    wordStyle.borderRadius = '0.25em'
                                    wordStyle.border = `${scaledBorderWidth}px solid ${isActive ? subtitleStyle.boxBorderColor : 'transparent'}`
                                  }

                                  return (
                                    <span key={index} style={wordStyle}>
                                      {word.text}
                                    </span>
                                  )
                                })}
                              </p>
                            ) : script ? (
                              <p
                                style={getScaledSubtitleStyle(subtitleStyle)}
                                className={`
                                  ${subtitleStyle.backgroundEnabled ? 'flex flex-wrap justify-center items-center' : ''}
                                `}
                              >
                                {(script.split(' ').slice(0, 7)).map((word, index) => {
                                  const isActive = index === 0
                                  const scale = videoPlayerSize.width / videoSize.width
                                  const scaledPadding = (subtitleStyle.boxPadding || 0) * scale
                                  const scaledBorderWidth = (subtitleStyle.boxBorderWidth || 0) * scale

                                  const wordStyle: React.CSSProperties = {
                                    opacity: isActive ? 1 : 0.7,
                                    display: 'inline-block',
                                    margin: '0 0.08em',
                                  }

                                  if (subtitleStyle.backgroundEnabled) {
                                    wordStyle.padding = `${scaledPadding}px`
                                    wordStyle.borderRadius = '0.25em'
                                    wordStyle.border = `${scaledBorderWidth}px solid ${isActive ? subtitleStyle.boxBorderColor : 'transparent'}`
                                  }
                                  
                                  return (
                                    <span key={index} style={wordStyle}>
                                      {word}
                                    </span>
                                  )
                                })}
                              </p>
                            ) : null }
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`mx-auto bg-black rounded-lg flex items-center justify-center ${
                        previewMode === 'mobile' ? 'aspect-[9/16] max-w-[200px]' : 'aspect-[16/9] w-full'
                      }`}>
                        <div className="text-center text-zinc-400">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Upload video to preview</p>
                        </div>
                      </div>
                    )}
                    
                    {backgroundVideoUrl && (
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePlayPause}
                          className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-700 bg-zinc-800"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? "Pause" : "Play"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadReel}
                          disabled={!finalVideoUrl && !generatedAudioUrl}
                          className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-700 bg-zinc-800"
                        >
                          <Download className="w-4 h-4" />
                          {finalVideoUrl ? 'Download Video' : 'Download Audio'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generated Assets */}
              {(generatedAudioUrl || subtitles) && (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedAudioUrl && (
                      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-zinc-300" />
                            <span className="text-sm font-medium">Audio Track</span>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <audio
                          controls
                          src={generatedAudioUrl}
                          className="w-full mt-2"
                          style={{ height: '32px' }}
                        />
                      </div>
                    )}
                    
                    {subtitles && (
                      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-zinc-300" />
                            <span className="text-sm font-medium">Subtitles</span>
                          </div>
                          <Badge variant="secondary">{subtitles.length} segments</Badge>
                        </div>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                            {subtitles.slice(0, 3).map((sub, i) => (
                              `${i + 1}. ${sub.text.trim()}\n`
                            )).join('')}
                            {subtitles.length > 3 && `... and ${subtitles.length - 3} more`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Estimated Duration</span>
                      <span className="text-sm font-medium">~{calculateEstimatedDuration(script)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Output Format</span>
                      <span className="text-sm font-medium">{videoSize.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Resolution</span>
                      <span className="text-sm font-medium">{videoSize.width}×{videoSize.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Voice Model</span>
                      <span className="text-sm font-medium">Kokoro TTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Subtitle Model</span>
                      <span className="text-sm font-medium">Whisper Small</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function generateASS(chunks: any[], style: SubtitleStyle, videoSize: VideoSize): string {
  const toAssTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString()
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0')
    return `${h}:${m}:${s}.${ms}`
  }

  // Convert color from #RRGGBB to &HAABBGGRR for ASS
  const convertColor = (hex: string, opacity: number = 1) => {
    // ASS alpha is 00=opaque, FF=transparent.
    // CSS opacity is 1=opaque, 0=transparent.
    // This formula converts CSS opacity to ASS alpha.
    const safeHex = hex || '#000000'
    const alpha = Math.round((1 - opacity) * 255).toString(16).toUpperCase().padStart(2, '0')
    const bbggrr = `${safeHex.substring(5, 7)}${safeHex.substring(3, 5)}${safeHex.substring(1, 3)}`
    return `&H${alpha}${bbggrr}`
  }

  const scale = videoSize.height / 720
  const scaledFontSize = Math.round(style.fontSize * scale * 1.2)

  const primaryColour = convertColor(style.color, style.textOpacity)
  const secondaryColour = convertColor(style.color, style.textOpacity * 0.6)
  
  let backColour: string, outlineColour: string, borderStyle: number, outline: number, shadow: number
  
  if (style.backgroundEnabled) {
    borderStyle = 3 // Opaque box
    backColour = convertColor('#000000', 0)
    outlineColour = convertColor(style.boxBorderColor)
    outline = style.boxBorderWidth * scale * 1.5
    shadow = style.boxPadding * scale * 1.5 // Padding
  } else {
    borderStyle = 1 // Outline + drop shadow
    backColour = convertColor('#000000', 0.5) // Shadow color
    outlineColour = convertColor(style.strokeColor)
    outline = style.strokeWidth * scale * 1.5
    shadow = outline / 2 // Shadow distance
  }

  const header = `[Script Info]
Title: Generated by Reelevate.AI
ScriptType: v4.00+
PlayResX: ${videoSize.width}
PlayResY: ${videoSize.height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Tiempos Text Regular,${scaledFontSize},${primaryColour},${secondaryColour},${outlineColour},${backColour},-1,0,0,0,100,100,0,0,${borderStyle},${outline},${shadow},2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
  
  const alignmentMap = { top: '{\\an8}', center: '{\\an5}', bottom: '{\\an2}' }
  const positionTag = alignmentMap[style.position]

  const events = chunks.map(chunk => {
    const start = chunk.timestamp[0]
    const end = chunk.timestamp[1]
    
    let dialogueText = chunk.words.map((word: any) => {
      const duration = (word.timestamp[1] - word.timestamp[0]) * 100
      const tag = style.backgroundEnabled ? '\\ko' : '\\k'
      return `{${tag}${Math.round(duration)}}${word.text.trim()}`
    }).join(' ')

    switch (style.animation) {
      case 'fade':
        dialogueText = `{\\fad(200,200)}${dialogueText}`
        break
    }

    return `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Default,,0,0,0,,${positionTag}${dialogueText}`
  }).join('\n')

  return header + events
}

const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Script load error for ${url}`))
    document.head.appendChild(script)
  })
}

const toBlobURL = async (url: string, mimeType: string) => {
  const resp = await fetch(url)
  const body = await resp.blob()
  return URL.createObjectURL(new Blob([body], { type: mimeType }))
}

const toBlobURLPatched = async (url: string, mimeType: string, patcher: (code: string) => string) => {
  const resp = await fetch(url)
  let body = await resp.text()
  if (patcher) {
    body = patcher(body)
  }
  const blob = new Blob([body], { type: mimeType })
  return URL.createObjectURL(blob)
}