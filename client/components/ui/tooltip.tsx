import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * Провайдер тултипов
 *
 * @description Обеспечивает контекст для компонентов тултипа.
 * Представляет собой реализацию Radix UI Tooltip Provider.
 *
 * @param {React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>} props - Свойства компонента
 *
 * @example
 * <TooltipProvider>
 *   <App />
 * </TooltipProvider>
 *
 * @returns {JSX.Element} Провайдер тултипов
 */
const TooltipProvider = TooltipPrimitive.Provider

/**
 * Корневой компонент тултипа
 *
 * @description Обертывает триггер и контент тултипа.
 * Представляет собой реализацию Radix UI Tooltip Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Tooltip>
 *   <TooltipTrigger>Наведи на меня</TooltipTrigger>
 *   <TooltipContent>Это тултип!</TooltipContent>
 * </Tooltip>
 *
 * @returns {JSX.Element} Корневой компонент тултипа
 */
const Tooltip = TooltipPrimitive.Root

/**
 * Триггер тултипа
 *
 * @description Элемент, при взаимодействии с которым отображается тултип.
 * Представляет собой реализацию Radix UI Tooltip Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>} props - Свойства компонента
 *
 * @example
 * <TooltipTrigger>Наведи на меня</TooltipTrigger>
 *
 * @returns {JSX.Element} Триггер тултипа
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Контент тултипа
 *
 * @component
 * @description Содержимое тултипа, которое отображается при наведении на триггер.
 *
 * @param {React.Ref<React.ElementRef<typeof TooltipPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {number} sideOffset - Смещение контента относительно триггера (по умолчанию 4)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <TooltipContent>Это тултип!</TooltipContent>
 *
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

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }