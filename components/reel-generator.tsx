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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Wand2, 
  Settings, 
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
  Monitor,
  Info
} from "lucide-react"
import { KokoroTTS } from "kokoro-js"
import type { ProgressInfo } from "@huggingface/transformers"
import { fetchFile } from "@ffmpeg/util"

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
  strokeWidth: 2,
  strokeColor: '#000000',
  position: 'bottom',
  animation: 'fade'
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
  
  const [activeTab, setActiveTab] = useState("script")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoPreviewRef = useRef<HTMLDivElement>(null)

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

      const { KokoroTTS } = await import('kokoro-js')
      updateGenerationStep('audio', 'processing', 10)
      const tts = await KokoroTTS.from_pretrained(
        "onnx-community/Kokoro-82M-v1.0-ONNX",
        { device: "webgpu", dtype: "fp32" }
      )
      updateGenerationStep('audio', 'processing', 40)
      
      const raw = await tts.generate(script, { voice: voice })
      const result = raw.audio
      const sampleRate = raw.sampling_rate || 24000
      updateGenerationStep('audio', 'processing', 80)

      const wav = encodeWAV(result, sampleRate)
      const blob = new Blob([wav], { type: "audio/wav" })
      const audioUrl = URL.createObjectURL(blob)
      setGeneratedAudioUrl(audioUrl)
      
      updateGenerationStep('audio', 'completed', 100)

      updateGenerationStep('subtitles', 'processing', 10)
	
      const { pipeline } = await import('@huggingface/transformers')
      const transcriber = await pipeline(
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
      updateGenerationStep('subtitles', 'processing', 90)
      
      const output = await transcriber(audioUrl, {
        return_timestamps: "word",
        chunk_length_s: 30,
        stride_length_s: 5,
      })
      
      const chunks = Array.isArray(output) 
        ? output[0].chunks 
        : (output.chunks || [])
      
      const safeChunks = chunks || []
      setSubtitles(safeChunks)

      const vttContent = generateAdvancedVTT(safeChunks, subtitleStyle)
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
        
        const assContent = generateASS(safeChunks, subtitleStyle, videoSize)
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
    WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
    paintOrder: 'stroke fill',
    display: 'inline-block',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.2',
    textShadow: `1px 1px 2px #000000cc`,
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
      WebkitTextStroke: `${style.strokeWidth * scale}px ${style.strokeColor}`,
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wand2 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Reelevate.AI
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create professional-quality video reels with AI-powered voiceovers and dynamic subtitles
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2">
            {/* Progress Indicator */}
            {isGenerating && (
              <Card className="mb-6 border-blue-800 bg-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-300">
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
                            <span className="text-xs text-muted-foreground">{step.progress}%</span>
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
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="script" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Script
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="background" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="script">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Craft Your Script
                    </CardTitle>
                    <CardDescription>
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
                          className="mt-2"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{script.length} characters</span>
                        <span>~{calculateEstimatedDuration(script)} seconds</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={nextTab} 
                      disabled={!canProceed.script}
                      className="ml-auto"
                    >
                      Next: Choose Voice
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="voice">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-blue-400" />
                      Select Voice Character
                    </CardTitle>
                    <CardDescription>
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
                              ? 'border-blue-500 bg-blue-900/50 ring-2 ring-blue-500'
                              : 'border-border hover:border-blue-700'
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
                    <Button onClick={nextTab} className="ml-auto">
                      Next: Upload Media
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="background">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-green-400" />
                      Background Media
                    </CardTitle>
                    <CardDescription>
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
                                  ? 'border-green-500 bg-green-900/50 ring-2 ring-green-500'
                                  : 'border-border hover:border-green-700'
                              }`}
                              onClick={() => setVideoSize(size)}
                            >
                              <size.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                              <div className="text-sm font-medium">{size.aspectRatio}</div>
                              <div className="text-xs text-muted-foreground">{size.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="background-video">Upload Video</Label>
                        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <Input
                            id="background-video"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="max-w-xs mx-auto"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Supports MP4, MOV, AVI files
                          </p>
                        </div>
                        {backgroundVideo && (
                          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-green-300">
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
                      className="ml-auto"
                    >
                      Next: Customize Style
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="style">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-400" />
                      Subtitle Styling
                    </CardTitle>
                    <CardDescription>
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
                          <div className="text-sm text-muted-foreground mt-1">{subtitleStyle.fontSize}px</div>
                        </div>
                        
                        <div>
                          <Label>Position</Label>
                          <Select
                            value={subtitleStyle.position}
                            onValueChange={(value: 'top' | 'center' | 'bottom') => 
                              setSubtitleStyle(prev => ({ ...prev, position: value }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
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
                              variant={subtitleStyle.animation === animation ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSubtitleStyle(prev => ({ 
                                ...prev, 
                                animation: animation as SubtitleStyle['animation'] 
                              }))}
                              className="capitalize"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                          <div>
                            <Label>Text Color</Label>
                            <Input
                              type="color"
                              value={subtitleStyle.color}
                              onChange={(e) => setSubtitleStyle(prev => ({ ...prev, color: e.target.value }))}
                              className="mt-2 h-10"
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
                          <div>
                            <Label>Stroke Color</Label>
                            <Input
                              type="color"
                              value={subtitleStyle.strokeColor}
                              onChange={(e) => setSubtitleStyle(prev => ({ ...prev, strokeColor: e.target.value }))}
                              className="mt-2 h-10"
                            />
                          </div>
                          <div>
                            <Label>Stroke Width</Label>
                            <Slider
                              value={[subtitleStyle.strokeWidth]}
                              onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, strokeWidth: value }))}
                              min={0} max={8} step={0.5}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={nextTab} className="ml-auto">
                      Next: Generate Reel
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="generate">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                      Generate Your Reel
                    </CardTitle>
                    <CardDescription>
                      Review your settings and create your professional reel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Script Length</span>
                            <Badge variant="secondary">{script.length} chars</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Voice</span>
                            <Badge variant="secondary">{VOICE_OPTIONS.find(v => v.value === voice)?.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Video Size</span>
                            <Badge variant="secondary">{videoSize.aspectRatio}</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Background</span>
                            <Badge variant={backgroundVideo ? "default" : "destructive"}>
                              {backgroundVideo ? "Uploaded" : "Missing"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Subtitle Style</span>
                            <Badge variant="secondary">{subtitleStyle.animation}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
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
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review Settings
                    </Button>
                    <Button
                      onClick={generateReel}
                      disabled={!canProceed.generate || isGenerating}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      {finalVideoUrl ? "Final Video" : "Live Preview"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(previewMode === 'mobile' ? 'desktop' : 'mobile')}
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
                                (chunk: any) => time >= chunk.timestamp[0] && time < chunk.timestamp[1]
                              )
                              setActiveSubtitleChunk(activeChunk || null)
                            }
                          }}
                        />
                        {!finalVideoUrl && generatedAudioUrl && (
                          <audio ref={audioRef} src={generatedAudioUrl} />
                        )}
                        
                        {/* Live Subtitle Overlay - only shows before final video is generated */}
                        {!finalVideoUrl && (
                          <div style={getSubtitleContainerStyle(subtitleStyle)}>
                            {activeSubtitleChunk && (
                              <p 
                                key={activeSubtitleChunk.timestamp[0]}
                                style={getScaledSubtitleStyle(subtitleStyle)}
                                className={!isTypewriterEffect ? `animate-${subtitleStyle.animation}` : ''}
                              >
                                {isTypewriterEffect ? typewriterText : activeSubtitleChunk.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`mx-auto bg-secondary rounded-lg flex items-center justify-center ${
                        previewMode === 'mobile' ? 'aspect-[9/16] max-w-[200px]' : 'aspect-[16/9] w-full'
                      }`}>
                        <div className="text-center text-muted-foreground">
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
                          className="flex items-center gap-2"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? "Pause" : "Play"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadReel}
                          disabled={!finalVideoUrl && !generatedAudioUrl}
                          className="flex items-center gap-2"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedAudioUrl && (
                      <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-green-400" />
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
                      <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium">Subtitles</span>
                          </div>
                          <Badge variant="secondary">{subtitles.length} segments</Badge>
                        </div>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estimated Duration</span>
                      <span className="text-sm font-medium">~{calculateEstimatedDuration(script)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Output Format</span>
                      <span className="text-sm font-medium">{videoSize.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Resolution</span>
                      <span className="text-sm font-medium">{videoSize.width}×{videoSize.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Voice Model</span>
                      <span className="text-sm font-medium">Kokoro TTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Subtitle Model</span>
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
    const alpha = Math.round((1 - opacity) * 255).toString(16).toUpperCase().padStart(2, '0')
    const bbggrr = `${hex.substring(5, 7)}${hex.substring(3, 5)}${hex.substring(1, 3)}`
    return `&H${alpha}${bbggrr}`
  }

  const primaryColour = convertColor(style.color, style.textOpacity)
  const outlineColour = convertColor(style.strokeColor)
  const backColour = convertColor('#000000', 0.5)

  const header = `[Script Info]
Title: Generated by Reelevate.AI
ScriptType: v4.00+
PlayResX: ${videoSize.width}
PlayResY: ${videoSize.height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Tiempos Text Regular,${style.fontSize},${primaryColour},&H00FFFFFF,${outlineColour},${backColour},-1,0,0,0,100,100,0,0,1,${style.strokeWidth},${style.strokeWidth / 2},2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
  
  const alignmentMap = { top: '{\\an8}', center: '{\\an5}', bottom: '{\\an2}' }
  const positionTag = alignmentMap[style.position]

  const events = chunks.map(chunk => {
    const start = chunk.timestamp[0]
    const end = chunk.timestamp[1]
    const text = chunk.text.trim()
    let animatedText = ""

    const animationDuration = 300 // ms

    switch (style.animation) {
      case 'fade':
        animatedText = `{\\fad(${animationDuration},${animationDuration})}${text}`
        break
      case 'slide':
        const y = style.position === 'top' ? 30 : (style.position === 'center' ? videoSize.height / 2 : videoSize.height - 30)
        animatedText = `{\\move(${videoSize.width/2}, ${y+50}, ${videoSize.width/2}, ${y}, 0, ${animationDuration})}{\\fad(${animationDuration},${animationDuration})}${text}`
        break
      case 'pop':
        animatedText = `{\\t(0,${animationDuration},\\fscx120\\fscy120\\fad(0,${animationDuration}))}${text}`
        break
      case 'typewriter':
        const words = text.split(' ')
        let wordStartTime = 0
        animatedText = words.map((word: string, i: number) => {
          const wordDuration = (word.length / 10) * 1000 // estimate duration based on length
          const tag = `{\\k${wordStartTime > 0 ? wordStartTime/10 : 0}}`
          wordStartTime += wordDuration
          return `${tag}${word}`
        }).join(' ')
        break
      default:
        animatedText = text
    }

    return `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Default,,0,0,0,,${positionTag}${animatedText}`
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