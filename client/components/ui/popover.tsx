import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * Компонент всплывающего окна (Popover)
 *
 * @description Используется как контейнер для элементов всплывающего окна.
 * Представляет собой реализацию Radix UI Popover Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Popover>
 *   <PopoverTrigger>Открыть поповер</PopoverTrigger>
 *   <PopoverContent>
 *     Содержимое поповера
 *   </PopoverContent>
 * </Popover>
 *
 * @returns {JSX.Element} Всплывающее окно
 */
const Popover = PopoverPrimitive.Root

/**
 * Компонент триггера всплывающего окна
 *
 * @description Используется для вызова всплывающего окна.
 * Представляет собой реализацию Radix UI Popover Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>} props - Свойства компонента
 *
 * @example
 * <PopoverTrigger>Открыть поповер</PopoverTrigger>
 *
 * @returns {JSX.Element} Триггер всплывающего окна
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Компонент содержимого всплывающего окна
 *
 * @component
 * @description Содержимое всплывающего окна.
 *
 * @param {React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'center' | 'start' | 'end'} align - Выравнивание содержимого (по умолчанию 'center')
 * @param {number} sideOffset - Смещение содержимого относительно триггера (по умолчанию 4)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <PopoverContent>
 *   <h4 className="font-medium leading-none">Заголовок</h4>
 *   <p className="text-sm text-muted-foreground">Описание</p>
 * </PopoverContent>
 *
 * @returns {JSX.Element} Содержимое всплывающего окна
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }