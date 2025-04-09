"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"

export function FloatingSettingsButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Link href="/chat/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Chat Settings</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Chat Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}