"use client"

import { useState, useCallback, memo, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { Crown, Mic, MicOff, Shield } from "lucide-react"
import { cn, debugColors } from "~/lib/utils"
import { useDebugRenders, useDebugState, useDebugEffect } from "~/lib/client-utils"

export interface PlayerAvatarProps {
  player: {
    id: number | string
    name: string
    avatar: string
    isHost?: boolean
    isCurrentUser?: boolean
    isReady?: boolean
    isSpeaking?: boolean
    isMuted?: boolean
    status?: "idle" | "typing" | "answered" | "thinking" | "away"
    streak?: number
    score?: number
    rank?: number
    role?: "player" | "host" | "moderator" | "observer"
  }
  showStatus?: boolean
  showName?: boolean
  showBadge?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
}

// Create the component as a regular function first so we can memoize it
const PlayerAvatarComponent = ({
  player,
  showStatus = true,
  showName = false,
  showBadge = true,
  size = "md",
  className,
  onClick,
}: PlayerAvatarProps) => {
  // Debug render count
  const renderCount = useDebugRenders('PlayerAvatar', debugColors.playerAvatar, { 
    player, 
    showStatus, 
    showName, 
    showBadge, 
    size, 
    className, 
    hasOnClick: !!onClick 
  })
  
  // Track component instance
  const instanceId = useRef(`avatar-${Math.random().toString(36).substr(2, 9)}`).current
  console.log(`%c[PlayerAvatar ${instanceId}] Component instance`, debugColors.playerAvatar)
  
  // State with debug tracking
  const [imageError, setImageError] = useState(false)
  useDebugState(imageError, 'imageError', `PlayerAvatar ${instanceId}`, debugColors.playerAvatar)
  
  const handleImageError = useCallback(() => {
    console.log(`%c[PlayerAvatar ${instanceId}] Image error handler called`, debugColors.playerAvatar)
    setImageError(true)
  }, [instanceId])

  const getSize = useCallback(() => {
    const result = size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : "h-12 w-12"
    console.log(`%c[PlayerAvatar ${instanceId}] getSize() called, returning: ${result}`, debugColors.playerAvatar)
    return result
  }, [size, instanceId])

  const getStatusColor = useCallback(() => {
    console.log(`%c[PlayerAvatar ${instanceId}] getStatusColor() called with status: ${player.status}`, debugColors.playerAvatar)
    
    switch (player.status) {
      case "typing": return "bg-green-500"
      case "answered": return "bg-blue-500"
      case "thinking": return "bg-yellow-500"
      case "away": return "bg-gray-500"
      default: return "bg-green-500"
    }
  }, [player.status, instanceId])

  const getStatusText = useCallback(() => {
    console.log(`%c[PlayerAvatar ${instanceId}] getStatusText() called with status: ${player.status}`, debugColors.playerAvatar)
    
    switch (player.status) {
      case "typing": return "Typing..."
      case "answered": return "Answered"
      case "thinking": return "Thinking..."
      case "away": return "Away"
      default: return "Online"
    }
  }, [player.status, instanceId])

  const getRoleBadge = useCallback(() => {
    console.log(`%c[PlayerAvatar ${instanceId}] getRoleBadge() called with role: ${player.role}, isHost: ${player.isHost}`, debugColors.playerAvatar)
    
    switch (player.role) {
      case "host":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-500">
            <Crown className="h-3 w-3" />
            <span>Host</span>
          </Badge>
        )
      case "moderator":
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-500">
            <Shield className="h-3 w-3" />
            <span>Mod</span>
          </Badge>
        )
      case "observer":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <span>Observer</span>
          </Badge>
        )
      default:
        if (player.isHost) {
          return (
            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-500">
              <Crown className="h-3 w-3" />
              <span>Host</span>
            </Badge>
          )
        }
        return null
    }
  }, [player.role, player.isHost, instanceId])

  // Debug for rendering phases
  console.log(`%c[PlayerAvatar ${instanceId}] Preparing to create avatarElement`, debugColors.playerAvatar)

  // Pre-create the avatar element to avoid recreating it inside the tooltip
  const avatarElement = (
    <div className="relative">
      <Avatar
        className={cn(
          getSize(),
          player.isCurrentUser && "ring-2 ring-primary ring-offset-2",
          player.isReady && "ring-2 ring-green-500 ring-offset-1",
          "transition-all duration-200",
          onClick && "cursor-pointer hover:opacity-90",
        )}
        onClick={onClick}
      >
        <AvatarImage
          src={!imageError ? player.avatar : undefined}
          alt={player.name}
          onError={handleImageError}
        />
        <AvatarFallback className="bg-primary/10 text-primary">
          {player.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Status indicator */}
      {showStatus && player.status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            player.status === "typing" && "animate-pulse",
            getStatusColor(),
          )}
        />
      )}

      {/* Voice indicators */}
      {player.isSpeaking && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1">
          <Mic className="h-3 w-3 text-white" />
        </div>
      )}

      {player.isMuted && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-red-500 p-1">
          <MicOff className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Rank indicator (if provided) */}
      {player.rank && player.rank <= 3 && (
        <div
          className={cn(
            "absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
            player.rank === 1 ? "bg-yellow-500" : player.rank === 2 ? "bg-gray-400" : "bg-amber-600",
          )}
        >
          {player.rank}
        </div>
      )}
    </div>
  );

  console.log(`%c[PlayerAvatar ${instanceId}] Preparing to create tooltipContent`, debugColors.playerAvatar)
  
  // Pre-create tooltip content to avoid recreation on each render
  const tooltipContent = (
    <TooltipContent side="top" align="center">
      <div className="text-center">
        <p className="font-medium">{player.name}</p>
        {player.score !== undefined && <p className="text-sm">Score: {player.score}</p>}
        {player.streak && player.streak > 1 && (
          <p className="text-sm text-orange-500">{player.streak}x streak!</p>
        )}
        {player.status && <p className="text-xs text-muted-foreground">{getStatusText()}</p>}
      </div>
    </TooltipContent>
  );

  console.log(`%c[PlayerAvatar ${instanceId}] Before final render, render #${renderCount}`, debugColors.playerAvatar)
  
  // Debug the component tree before rendering
  useDebugEffect('componentTree', `PlayerAvatar ${instanceId}`, debugColors.playerAvatar, [renderCount])

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Using Tooltip directly without nesting TooltipProvider */}
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarElement}
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>

      {showName && <span className="mt-1 text-xs font-medium">{player.name}</span>}

      {showBadge && getRoleBadge()}
    </div>
  )
}

// Export a memoized version with debugging for the memo comparison
const PlayerAvatarMemo = memo(PlayerAvatarComponent, (prevProps, nextProps) => {
  const arePropsEqual = 
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.name === nextProps.player.name &&
    prevProps.player.avatar === nextProps.player.avatar &&
    prevProps.player.isHost === nextProps.player.isHost &&
    prevProps.player.isCurrentUser === nextProps.player.isCurrentUser &&
    prevProps.player.isReady === nextProps.player.isReady &&
    prevProps.player.isSpeaking === nextProps.player.isSpeaking &&
    prevProps.player.isMuted === nextProps.player.isMuted &&
    prevProps.player.status === nextProps.player.status &&
    prevProps.showStatus === nextProps.showStatus &&
    prevProps.showName === nextProps.showName &&
    prevProps.showBadge === nextProps.showBadge &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className;
    
  console.log(`%c[PlayerAvatar] Memo comparison:`, debugColors.playerAvatar, { 
    prevProps, 
    nextProps, 
    arePropsEqual
  });
  
  return arePropsEqual;
});

// Export the memoized component
export const PlayerAvatar = PlayerAvatarMemo;
