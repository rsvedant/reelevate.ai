"use client"

import type React from "react"

import { useState } from "react"
import { Settings, Download, Upload, Trash2, Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"

interface SettingsDialogProps {
  onClearAllData: () => void
  onExportData: () => void
  onImportData: (file: File) => void
}

export default function SettingsDialog({ onClearAllData, onExportData, onImportData }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const { theme, setTheme } = useTheme()

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImportData(file)
    }
  }

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all conversations? This action cannot be undone.")) {
      onClearAllData()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Appearance</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="text-sm text-zinc-300">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-zinc-700" />

          {/* Chat Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Chat Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save" className="text-sm text-zinc-300">
                  Auto-save conversations
                </Label>
                <p className="text-xs text-zinc-500">Automatically save conversations to local storage</p>
              </div>
              <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streaming" className="text-sm text-zinc-300">
                  Streaming responses
                </Label>
                <p className="text-xs text-zinc-500">Show responses as they are generated</p>
              </div>
              <Switch id="streaming" checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
            </div>
          </div>

          <Separator className="bg-zinc-700" />

          {/* Data Management */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">Data Management</h3>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                onClick={onExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export conversations
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  className="w-full justify-start bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import conversations
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start bg-red-900/20 border-red-700 hover:bg-red-900/30 text-red-400"
                onClick={handleClearData}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all data
              </Button>
            </div>
          </div>

          <Separator className="bg-zinc-700" />

          {/* About */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">About</h3>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>Reelevate.AI v1.0.0</p>
              <p>Local AI-powered reel ideas generator</p>
              <p>Built with WebLLM and Next.js</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
