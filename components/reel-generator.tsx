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
  Monitor
} from "lucide-react"
import { KokoroTTS } from "kokoro-js"
import { pipeline, AutomaticSpeechRecognitionOutput, ProgressCallback, ProgressInfo } from "@huggingface/transformers"

// Utility functions
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

// Types
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
  backgroundColor: string
  borderRadius: number
  padding: number
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

// Constants
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
  fontFamily: 'Inter, sans-serif',
  fontSize: 32,
  fontWeight: 'bold',
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: 8,
  padding: 12,
  strokeWidth: 2,
  strokeColor: '#000000',
  position: 'bottom',
  animation: 'fade'
}

export function ReelGenerator() {
  // Core state
  const [script, setScript] = useState("Transform your ideas into captivating stories that resonate with millions. Every word matters, every frame counts.")
  const [voice, setVoice] = useState<Voice>("af_heart")
  const [backgroundVideo, setBackgroundVideo] = useState<File | null>(null)
  const [videoSize, setVideoSize] = useState<VideoSize>(VIDEO_SIZES[0])
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: 'audio', name: 'Generating Audio', status: 'pending', progress: 0 },
    { id: 'subtitles', name: 'Creating Subtitles', status: 'pending', progress: 0 },
    { id: 'processing', name: 'Processing Video', status: 'pending', progress: 0 },
    { id: 'finalizing', name: 'Finalizing Reel', status: 'pending', progress: 0 },
  ])
  
  // Media state
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [subtitles, setSubtitles] = useState<any[] | null>(null)
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null)
  const [vttUrl, setVttUrl] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState("script")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Models are now loaded on-demand inside the generateReel function
  // to avoid loading them on page load and to fix function call errors.

  // Utility functions
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
    vtt += `  background-color: ${style.backgroundColor};\n`
    vtt += `  border-radius: ${style.borderRadius}px;\n`
    vtt += `  padding: ${style.padding}px;\n`
    vtt += `  text-stroke: ${style.strokeWidth}px ${style.strokeColor};\n`
    vtt += "  text-align: center;\n"
    vtt += "  white-space: pre-line;\n"
    vtt += "}\n\n"
    
    chunks.forEach((chunk, index) => {
      const [start, end] = chunk.timestamp
      vtt += `${index + 1}\n`
      vtt += `${formatTimestamp(start)} --> ${formatTimestamp(end)}\n`
      
      // Add word-level emphasis for better readability
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

    try {
      // Step 1: Generate Audio
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

      // Step 2: Generate Subtitles
      updateGenerationStep('subtitles', 'processing', 10)
      
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small",
        {
          dtype: 'fp32',
          device: 'webgpu',
          progress_callback: (progressInfo: ProgressInfo) => {
            if ('status' in progressInfo && progressInfo.status === 'progress') {
              const progress = 10 + (progressInfo.progress * 0.8) // Map 0-100 to 10-90
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
      
      // Handle both array and single result cases from the speech recognition output
      const chunks = Array.isArray(output) 
        ? output[0].chunks 
        : (output.chunks || []);
      
      // Ensure chunks is always a valid array for TypeScript type checking
      const safeChunks = chunks || [];
      setSubtitles(safeChunks);

      const vttContent = generateAdvancedVTT(safeChunks, subtitleStyle);
      const vttBlob = new Blob([vttContent], { type: "text/vtt" });
      setVttUrl(URL.createObjectURL(vttBlob));
      
      updateGenerationStep('subtitles', 'completed', 100)

      // Step 3: Process Video
      updateGenerationStep('processing', 'processing', 50)
      await new Promise(resolve => setTimeout(resolve, 500))
      updateGenerationStep('processing', 'completed', 100)

      // Step 4: Finalize
      updateGenerationStep('finalizing', 'processing', 80)
      await new Promise(resolve => setTimeout(resolve, 300))
      updateGenerationStep('finalizing', 'completed', 100)

    } catch (error) {
      console.error("Error generating reel:", error)
      setGenerationSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ))
    } finally {
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
    if (generatedAudioUrl) {
      const a = document.createElement('a')
      a.href = generatedAudioUrl
      a.download = 'generated-reel-audio.wav'
      a.click()
    }
  }, [generatedAudioUrl])

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
                        <span>~{Math.ceil(script.length / 150)} seconds</span>
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
                            Supports MP4, MOV, AVI files up to 100MB
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
                            <Label>Background Color</Label>
                            <Input
                              type="color"
                              value={subtitleStyle.backgroundColor.replace('rgba(0, 0, 0, 0.8)', '#000000')}
                              onChange={(e) => setSubtitleStyle(prev => ({ 
                                ...prev, 
                                backgroundColor: `${e.target.value}CC` 
                              }))}
                              className="mt-2 h-10"
                            />
                          </div>
                          <div>
                            <Label>Border Radius</Label>
                            <Slider
                              value={[subtitleStyle.borderRadius]}
                              onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, borderRadius: value }))}
                              min={0}
                              max={20}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Padding</Label>
                            <Slider
                              value={[subtitleStyle.padding]}
                              onValueChange={([value]) => setSubtitleStyle(prev => ({ ...prev, padding: value }))}
                              min={4}
                              max={24}
                              step={2}
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
                      Live Preview
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
                  {backgroundVideoUrl ? (
                    <div className={`mx-auto bg-black rounded-lg overflow-hidden ${
                      previewMode === 'mobile' ? 'aspect-[9/16] max-w-[200px]' : 'aspect-[16/9] w-full'
                    }`}>
                      <video
                        ref={videoRef}
                        src={backgroundVideoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onTimeUpdate={(e) => {
                          const time = e.currentTarget.currentTime
                          if (audioRef.current) {
                            audioRef.current.currentTime = time
                          }
                        }}
                      >
                        {vttUrl && (
                          <track
                            src={vttUrl}
                            kind="subtitles"
                            srcLang="en"
                            label="English"
                            default
                          />
                        )}
                      </video>
                      {generatedAudioUrl && (
                        <audio ref={audioRef} src={generatedAudioUrl} />
                      )}
                      
                      {/* Subtitle Preview Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <div 
                          className="inline-block px-3 py-2 rounded-lg text-white font-bold text-sm"
                          style={{
                            backgroundColor: subtitleStyle.backgroundColor,
                            fontSize: `${Math.max(12, subtitleStyle.fontSize * 0.4)}px`,
                            borderRadius: `${subtitleStyle.borderRadius}px`,
                            padding: `${Math.max(4, subtitleStyle.padding * 0.5)}px ${subtitleStyle.padding * 0.7}px`
                          }}
                        >
                          Sample subtitle text
                        </div>
                      </div>
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
                      {generatedAudioUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadReel}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  )}
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
                      <span className="text-sm font-medium">~{Math.ceil(script.length / 150)}s</span>
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