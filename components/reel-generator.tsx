"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
import { KokoroTTS } from "kokoro-js"
import { pipeline } from "@huggingface/transformers"

function formatTimestamp(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0")
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

  const floatTo16BitPCM = (
    output: DataView,
    offset: number,
    input: Float32Array
  ) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
  }

  writeString(view, 0, "RIFF") // RIFF identifier
  view.setUint32(4, 36 + samples.length * 2, true) // file length
  writeString(view, 8, "WAVE") // WAVE identifier
  writeString(view, 12, "fmt ") // fmt chunk identifier
  view.setUint32(16, 16, true) // format chunk length
  view.setUint16(20, 1, true) // sample format (1 for PCM)
  view.setUint16(22, 1, true) // channel count
  view.setUint32(24, sampleRate, true) // sample rate
  view.setUint32(28, sampleRate * 2, true) // byte rate (sample rate * block align)
  view.setUint16(32, 2, true) // block align (channel count * bytes per sample)
  view.setUint16(34, 16, true) // bits per sample
  writeString(view, 36, "data") // data chunk identifier
  view.setUint32(40, samples.length * 2, true) // data chunk length
  floatTo16BitPCM(view, 44, samples)

  return view
}

type Voice =
  | "af_heart"
  | "af_bella"
  | "af_nicole"
  | "am_michael"
  | "bf_emma"
  | "bm_george"

export function ReelGenerator() {
  const [script, setScript] = useState("Life is like a box of chocolates. You never know what you're gonna get.")
  const [voice, setVoice] = useState<Voice>("af_heart")
  const [backgroundVideo, setBackgroundVideo] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [subtitles, setSubtitles] = useState<any[] | null>(null)
  const [generationStatus, setGenerationStatus] = useState("Initializing...")
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null)
  const [vttUrl, setVttUrl] = useState<string | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [tts, setTts] = useState<any>(null)

  useEffect(() => {
    const loadModel = async () => {
      setGenerationStatus("Loading model...")
      try {
        const model = await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-v1.0-ONNX",
          {
            device: "webgpu",
            dtype: "fp32",
          }
        )
        setTts(model)
        setGenerationStatus("Model loaded.")
      } catch (err) {
        console.error("Failed to load model", err)
        setGenerationStatus("Failed to load model.")
      }
    }

    loadModel()
  }, [])

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBackgroundVideo(file)
      setBackgroundVideoUrl(URL.createObjectURL(file))
    }
  }

  const generateVTT = (chunks: any[]) => {
    let vtt = "WEBVTT\n\n"
    chunks.forEach((chunk, index) => {
      const [start, end] = chunk.timestamp
      vtt += `${index + 1}\n`
      vtt += `${formatTimestamp(start)} --> ${formatTimestamp(end)}\n`
      vtt += `${chunk.text.trim()}\n\n`
    })
    return vtt
  }

  const generateReel = async () => {
    if (!script || !tts) return

    setIsGenerating(true)
    setGeneratedAudioUrl(null)
    setSubtitles(null)
    setGenerationStatus("Generating voice...")

    try {
      const raw = await tts.generate(script, {
        voice: voice,
      })
      const result = raw.audio
      const sampleRate = raw.sampling_rate || 24000

      const wav = encodeWAV(result, sampleRate)
      const blob = new Blob([wav], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      setGeneratedAudioUrl(url)

      // Generate subtitles
      setGenerationStatus("Generating subtitles...")
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small",
        {
            dtype: 'fp32',
            device: 'webgpu'
        }
      )
      const output = await transcriber(url, {
        return_timestamps: "word",
      })
      //@ts-ignore
      const chunks = output.chunks
      setSubtitles(chunks)

      const vttContent = generateVTT(chunks)
      const vttBlob = new Blob([vttContent], { type: "text/vtt" })
      setVttUrl(URL.createObjectURL(vttBlob))

      setGenerationStatus("Done.")
    } catch (error) {
      console.error("Error generating reel:", error)
      setGenerationStatus("An error occurred during generation.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlay = () => {
    videoRef.current?.play()
    audioRef.current?.play()
  }

  const handlePause = () => {
    videoRef.current?.pause()
    audioRef.current?.pause()
  }

  const handleSeek = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const time = e.currentTarget.currentTime
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  return (
    <div className="container mx-auto p-4">
      {backgroundVideoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Reel Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <video
                ref={videoRef}
                src={backgroundVideoUrl}
                controls={false}
                className="w-full rounded-md"
                muted
                onPlay={() => audioRef.current?.play()}
                onPause={() => audioRef.current?.pause()}
                onTimeUpdate={handleSeek}
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
            </div>
            <div className="mt-2 flex gap-2">
              <Button onClick={handlePlay}>Play</Button>
              <Button onClick={handlePause}>Pause</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="script" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="script">1. Script</TabsTrigger>
          <TabsTrigger value="voice">2. Voice</TabsTrigger>
          <TabsTrigger value="background">3. Background</TabsTrigger>
          <TabsTrigger value="generate">4. Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Script</CardTitle>
              <CardDescription>
                Write or paste your script here. The script will be used to
                generate the voiceover for your reel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your script..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Select Voice</CardTitle>
              <CardDescription>
                Choose a voice for your reel's narration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="voice">Voice</Label>
              <Select value={voice} onValueChange={(v) => setVoice(v as Voice)}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="af_heart">American Female (Heart)</SelectItem>
                  <SelectItem value="af_bella">American Female (Bella)</SelectItem>
                  <SelectItem value="af_nicole">American Female (Nicole)</SelectItem>
                  <SelectItem value="am_michael">American Male (Michael)</SelectItem>
                  <SelectItem value="bf_emma">British Female (Emma)</SelectItem>
                  <SelectItem value="bm_george">British Male (George)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle>Select Background Video</CardTitle>
              <CardDescription>
                Upload a background video for your reel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="background-video">Background Video</Label>
              <Input
                id="background-video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
              />
              {backgroundVideo && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {backgroundVideo.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Your Reel</CardTitle>
              <CardDescription>
                You are all set! Click the button below to generate your reel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold">Summary:</h3>
                <p>
                  <strong>Script:</strong>{" "}
                  {script.substring(0, 100)}
                  {script.length > 100 ? "..." : ""}
                </p>
                <p>
                  <strong>Voice:</strong> {voice}
                </p>
                <p>
                  <strong>Background Video:</strong>{" "}
                  {backgroundVideo ? backgroundVideo.name : "None selected"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={generateReel}
                disabled={!script || isGenerating || !tts}
              >
                {isGenerating ? generationStatus : tts ? "Generate" : "Loading Model..."}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      {generatedAudioUrl && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Generated Voiceover</CardTitle>
          </CardHeader>
          <CardContent>
            <audio
              controls
              src={generatedAudioUrl}
              className="w-full"
              ref={audioRef}
            />
          </CardContent>
        </Card>
      )}
      {subtitles && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Generated Subtitles</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-2 bg-gray-100 rounded-md overflow-x-auto">
              {JSON.stringify(subtitles, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 