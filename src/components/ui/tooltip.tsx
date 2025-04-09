"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn, debugColors } from "~/lib/utils"

const TooltipProvider = React.memo(function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  // Add debug logging
  console.log(`%c[TooltipProvider] Rendering with:`, debugColors.tooltip, { delayDuration, props })
  
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
})

const Tooltip = React.memo(function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const instanceId = React.useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`).current
  
  // Add debug logging
  console.log(`%c[Tooltip ${instanceId}] Rendering with:`, debugColors.tooltip, { props, childrenCount: React.Children.count(children) })
  
  // Track ref updates and renders
  React.useEffect(() => {
    console.log(`%c[Tooltip ${instanceId}] Mounted`, debugColors.tooltip)
    return () => {
      console.log(`%c[Tooltip ${instanceId}] Unmounted`, debugColors.tooltip)
    }
  }, [instanceId])
  
  return <TooltipPrimitive.Root data-slot="tooltip" data-instance-id={instanceId} {...props}>{children}</TooltipPrimitive.Root>
})

const TooltipTrigger = React.memo(function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const instanceId = React.useRef(`trigger-${Math.random().toString(36).substr(2, 9)}`).current
  
  // Add debug logging
  console.log(`%c[TooltipTrigger ${instanceId}] Rendering with:`, debugColors.tooltip, { 
    props, 
    hasAsChild: !!props.asChild,
    childrenType: props.children ? typeof props.children : 'none'
  })
  
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" data-instance-id={instanceId} {...props} />
})

const TooltipContent = React.memo(function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const instanceId = React.useRef(`content-${Math.random().toString(36).substr(2, 9)}`).current
  
  // Add debug logging
  console.log(`%c[TooltipContent ${instanceId}] Rendering with:`, debugColors.tooltip, { 
    className, 
    sideOffset, 
    props, 
    childrenCount: React.Children.count(children) 
  })
  
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-instance-id={instanceId}
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
})

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
