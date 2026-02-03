import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * Провайдер тултипов
 * Обеспечивает контекст для компонентов тултипа
 */
const TooltipProvider = TooltipPrimitive.Provider

/**
 * Корневой компонент тултипа
 * Обертывает триггер и контент тултипа
 */
const Tooltip = TooltipPrimitive.Root

/**
 * Триггер тултипа
 * Элемент, при взаимодействии с которым отображается тултип
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Контент тултипа
 * Содержимое тултипа, которое отображается при наведении на триггер
 *
 * @param {React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>} props - Свойства компонента
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @returns {JSX.Element} Компонент контента тултипа
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * Экспортируемые компоненты тултипа
 * @exports {React.Component} Tooltip - Корневой компонент тултипа
 * @exports {React.Component} TooltipTrigger - Триггер тултипа
 * @exports {React.Component} TooltipContent - Контент тултипа
 * @exports {React.Component} TooltipProvider - Провайдер тултипов
 */
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }