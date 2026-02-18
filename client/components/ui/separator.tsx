import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Компонент разделителя
 *
 * @component
 * @description Горизонтальная или вертикальная линия для разделения элементов интерфейса.
 *
 * @param {React.Ref<React.ElementRef<typeof SeparatorPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'horizontal' | 'vertical'} orientation - Ориентация разделителя (по умолчанию 'horizontal')
 * @param {boolean} decorative - Является ли разделитель декоративным элементом (по умолчанию true)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Горизонтальный разделитель
 * <Separator />
 *
 * @example
 * // Вертикальный разделитель
 * <Separator orientation="vertical" />
 *
 * @example
 * // Разделитель с дополнительными классами
 * <Separator className="my-4 bg-gray-300" />
 *
 * @returns {JSX.Element} Разделитель
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
