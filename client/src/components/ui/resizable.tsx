"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"
import { useState } from "react"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <ResizablePrimitive.PanelResizeHandle
      data-testid="resizable-handle"
      className={cn(
        "group relative flex w-2 items-center justify-center bg-border transition-all duration-200",
        "hover:bg-primary/20 hover:w-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 after:bg-transparent hover:after:bg-primary/10 after:transition-all after:duration-200",
        "data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:hover:h-3",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-3 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
        "[&[data-panel-group-direction=vertical]>div]:rotate-90",
        isDragging && "bg-primary w-3 after:bg-primary/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      {...props}
    >
      {withHandle && (
        <div className={cn(
          "grip-handle z-10 flex h-6 w-4 items-center justify-center rounded-md border border-border bg-background shadow-sm transition-all duration-200",
          "group-hover:bg-muted group-hover:border-primary/30 group-hover:shadow-md group-hover:scale-105",
          "dark:bg-background dark:border-border dark:group-hover:bg-muted dark:group-hover:border-primary/50",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1",
          isHovered && "scale-110 shadow-lg border-primary/40",
          isDragging && "scale-105 bg-primary/10 border-primary shadow-lg ring-2 ring-primary/20"
        )}>
          <GripVertical className={cn(
            "h-3 w-3 text-muted-foreground transition-all duration-200",
            "group-hover:text-primary group-hover:drop-shadow-sm",
            isHovered && "scale-110 text-primary",
            isDragging && "text-primary scale-125 drop-shadow-md"
          )} />
          
          {/* Dot indicators for better visual feedback */}
          <div className={cn(
            "absolute inset-0 rounded-md opacity-0 transition-opacity duration-200",
            "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
            isHovered && "opacity-100",
            isDragging && "opacity-100 from-primary/10 via-primary/20 to-primary/10"
          )} />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
