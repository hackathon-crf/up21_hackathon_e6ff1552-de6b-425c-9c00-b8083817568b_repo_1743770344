"use client"

import { useState, useEffect, useCallback, memo, useRef } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn, debugColors } from "~/lib/utils"
import { useDebugRenders, useDebugState, useDebugEffect } from "~/lib/client-utils"

type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected"
type ConnectionQuality = "excellent" | "good" | "fair" | "poor"

interface ConnectionStatusProps {
  className?: string
  showLabel?: boolean
  showTooltip?: boolean
}

// Use memo to prevent unnecessary re-renders
const ConnectionStatusComponent = ({ 
  className, 
  showLabel = false, 
  showTooltip = true 
}: ConnectionStatusProps) => {
  // Debug render count and instance tracking
  const renderCount = useDebugRenders('ConnectionStatus', debugColors.connectionStatus, {
    className,
    showLabel,
    showTooltip
  })
  
  // Create a unique ID for this component instance to track it in logs
  const instanceId = useRef(`conn-${Math.random().toString(36).substr(2, 9)}`).current
  console.log(`%c[ConnectionStatus ${instanceId}] Component instance`, debugColors.connectionStatus)
  
  // State with debug tracking
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  useDebugState(status, 'status', `ConnectionStatus ${instanceId}`, debugColors.connectionStatus)
  
  const [quality, setQuality] = useState<ConnectionQuality>("good")
  useDebugState(quality, 'quality', `ConnectionStatus ${instanceId}`, debugColors.connectionStatus)
  
  const [latency, setLatency] = useState<number>(0)
  useDebugState(latency, 'latency', `ConnectionStatus ${instanceId}`, debugColors.connectionStatus)

  // Simulate connection status changes - fixed to avoid dependency loops
  useDebugEffect('connectionSimulation', `ConnectionStatus ${instanceId}`, debugColors.connectionStatus, [])
  
  useEffect(() => {
    console.log(`%c[ConnectionStatus ${instanceId}] Initial connection effect started`, debugColors.connectionStatus)
    
    // Simulate initial connection
    const timer = setTimeout(() => {
      console.log(`%c[ConnectionStatus ${instanceId}] Setting initial connection state`, debugColors.connectionStatus)
      setStatus("connected")
      setLatency(35)
    }, 1500)

    // Create a function to update network quality to avoid closures over state
    const updateNetworkQuality = () => {
      const rand = Math.random()
      console.log(`%c[ConnectionStatus ${instanceId}] updateNetworkQuality called with random value: ${rand}`, debugColors.connectionStatus)
      
      if (rand > 0.9) {
        // Handle reconnection scenario
        console.log(`%c[ConnectionStatus ${instanceId}] Simulating connection interruption`, debugColors.connectionStatus)
        setStatus("reconnecting")
        setQuality("poor")
        setLatency(150)

        // Use setTimeout directly, not nested in another state update
        const reconnectTimer = setTimeout(() => {
          console.log(`%c[ConnectionStatus ${instanceId}] Simulating reconnection`, debugColors.connectionStatus)
          setStatus("connected")
          setQuality("fair")
          setLatency(85)
        }, 2000)

        const improveTimer = setTimeout(() => {
          console.log(`%c[ConnectionStatus ${instanceId}] Simulating connection improvement`, debugColors.connectionStatus)
          setQuality("good")
          setLatency(45)
        }, 5000)

        return () => {
          clearTimeout(reconnectTimer)
          clearTimeout(improveTimer)
        }
      } else if (rand > 0.7) {
        console.log(`%c[ConnectionStatus ${instanceId}] Setting quality to fair`, debugColors.connectionStatus)
        setQuality("fair")
        setLatency(75)
      } else if (rand > 0.4) {
        console.log(`%c[ConnectionStatus ${instanceId}] Setting quality to good`, debugColors.connectionStatus)
        setQuality("good")
        setLatency(40)
      } else if (rand < 0.2) {
        console.log(`%c[ConnectionStatus ${instanceId}] Setting quality to excellent`, debugColors.connectionStatus)
        setQuality("excellent")
        setLatency(25)
      }
    }

    // Simulate occasional network quality changes
    const qualityInterval = setInterval(() => {
      console.log(`%c[ConnectionStatus ${instanceId}] Quality interval triggered`, debugColors.connectionStatus)
      updateNetworkQuality()
    }, 10000)

    return () => {
      console.log(`%c[ConnectionStatus ${instanceId}] Cleaning up timers`, debugColors.connectionStatus)
      clearTimeout(timer)
      clearInterval(qualityInterval)
    }
  }, [instanceId]) // Only depend on instanceId which never changes

  // Memoize these functions to prevent recreating them on each render
  const getStatusColor = useCallback(() => {
    console.log(`%c[ConnectionStatus ${instanceId}] getStatusColor called with status: ${status}, quality: ${quality}`, debugColors.connectionStatus)
    
    switch (status) {
      case "connected":
        switch (quality) {
          case "excellent": return "text-green-500"
          case "good": return "text-green-400"
          case "fair": return "text-yellow-500"
          case "poor": return "text-orange-500"
        }
      case "connecting": return "text-blue-500 animate-pulse"
      case "reconnecting": return "text-yellow-500 animate-pulse"
      case "disconnected": return "text-red-500"
    }
  }, [status, quality, instanceId])

  const getStatusIcon = useCallback(() => {
    console.log(`%c[ConnectionStatus ${instanceId}] getStatusIcon called with status: ${status}`, debugColors.connectionStatus)
    
    switch (status) {
      case "connected":
        return <Wifi className={cn("h-4 w-4", getStatusColor())} />
      case "connecting":
      case "reconnecting":
        return <Wifi className={cn("h-4 w-4", getStatusColor())} />
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }, [status, getStatusColor, instanceId])

  const getStatusText = useCallback(() => {
    console.log(`%c[ConnectionStatus ${instanceId}] getStatusText called with status: ${status}, quality: ${quality}, latency: ${latency}`, debugColors.connectionStatus)
    
    switch (status) {
      case "connected":
        return `${quality.charAt(0).toUpperCase() + quality.slice(1)} (${latency}ms)`
      case "connecting": return "Connecting..."
      case "reconnecting": return "Reconnecting..."
      case "disconnected": return "Disconnected"
    }
  }, [status, quality, latency, instanceId])

  const getTooltipText = useCallback(() => {
    console.log(`%c[ConnectionStatus ${instanceId}] getTooltipText called with status: ${status}, quality: ${quality}, latency: ${latency}`, debugColors.connectionStatus)
    
    switch (status) {
      case "connected":
        switch (quality) {
          case "excellent": return `Excellent connection: ${latency}ms latency`
          case "good": return `Good connection: ${latency}ms latency`
          case "fair": return `Fair connection: ${latency}ms latency. Some lag may occur.`
          case "poor": return `Poor connection: ${latency}ms latency. Expect some lag.`
        }
      case "connecting": return "Establishing connection to game server..."
      case "reconnecting": return "Connection interrupted. Attempting to reconnect..."
      case "disconnected": return "No connection to game server. Check your internet connection."
    }
  }, [status, quality, latency, instanceId])

  console.log(`%c[ConnectionStatus ${instanceId}] Before creating badge content, render #${renderCount}`, debugColors.connectionStatus)

  // Create the badge content
  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 py-1 px-2 h-7 transition-all",
        status === "reconnecting" && "animate-pulse",
        className,
      )}
    >
      {getStatusIcon()}
      {showLabel && <span className="text-xs">{getStatusText()}</span>}
    </Badge>
  )

  console.log(`%c[ConnectionStatus ${instanceId}] Before final render, showTooltip: ${showTooltip}`, debugColors.connectionStatus)

  // Conditionally render with tooltip
  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p className="text-sm">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return badgeContent;
}

// Export a memoized version with debugging for the memo comparison
const ConnectionStatusMemo = memo(ConnectionStatusComponent, (prevProps, nextProps) => {
  const arePropsEqual = 
    prevProps.className === nextProps.className &&
    prevProps.showLabel === nextProps.showLabel &&
    prevProps.showTooltip === nextProps.showTooltip;
    
  console.log(`%c[ConnectionStatus] Memo comparison:`, debugColors.connectionStatus, { 
    prevProps, 
    nextProps, 
    arePropsEqual
  });
  
  return arePropsEqual;
});

// Export the memoized component
export const ConnectionStatus = ConnectionStatusMemo;
