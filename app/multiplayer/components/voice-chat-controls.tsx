"use client"

import { useState, useEffect, useMemo } from "react"
import { Mic, MicOff, Headphones, BluetoothOffIcon as HeadphonesOff, Volume2, VolumeX } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Slider } from "~/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"

interface VoiceChatControlsProps {
  className?: string
  compact?: boolean
  onMicToggle?: (enabled: boolean) => void
  onVolumeChange?: (volume: number) => void
}

export function VoiceChatControls({ className, compact = false, onMicToggle, onVolumeChange }: VoiceChatControlsProps) {
  const [micEnabled, setMicEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")

  // Memoize the volume array to prevent creating a new array on each render
  const volumeValue = useMemo(() => [volume], [volume])

  // Simulate connection status
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus("connected")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Simulate speaking detection
  useEffect(() => {
    if (!micEnabled) return

    const speakingInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsSpeaking(true)
        setTimeout(() => setIsSpeaking(false), Math.random() * 2000 + 500)
      }
    }, 3000)

    return () => clearInterval(speakingInterval)
  }, [micEnabled])

  const toggleMic = () => {
    const newState = !micEnabled
    setMicEnabled(newState)
    if (onMicToggle) onMicToggle(newState)
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (onVolumeChange) onVolumeChange(newVolume)
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={micEnabled ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isSpeaking && micEnabled && "animate-pulse bg-green-500 text-white hover:bg-green-600",
                )}
                onClick={toggleMic}
              >
                {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span className="sr-only">{micEnabled ? "Mute" : "Unmute"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{micEnabled ? "Mute microphone" : "Unmute microphone"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={toggleAudio}
              >
                {audioEnabled ? <Headphones className="h-4 w-4" /> : <HeadphonesOff className="h-4 w-4" />}
                <span className="sr-only">{audioEnabled ? "Disable audio" : "Enable audio"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{audioEnabled ? "Disable audio" : "Enable audio"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-card p-2 h-32", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">Voice Chat</h3>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            connectionStatus === "connected"
              ? "border-green-500 text-green-500"
              : connectionStatus === "connecting"
                ? "border-yellow-500 text-yellow-500 animate-pulse"
                : "border-red-500 text-red-500",
          )}
        >
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant={micEnabled ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-8 w-8",
              isSpeaking && micEnabled && "animate-pulse bg-green-500 text-white hover:bg-green-600",
            )}
            onClick={toggleMic}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            <span className="sr-only">{micEnabled ? "Mute" : "Unmute"}</span>
          </Button>
          <Button variant={audioEnabled ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={toggleAudio}>
            {audioEnabled ? <Headphones className="h-4 w-4" /> : <HeadphonesOff className="h-4 w-4" />}
            <span className="sr-only">{audioEnabled ? "Disable audio" : "Enable audio"}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </div>
          <Slider
            disabled={!audioEnabled}
            value={volumeValue} // Use the memoized value instead of creating a new array
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <div className="w-8 text-center text-sm">{volume}%</div>
        </div>
      </div>
    </div>
  )
}
