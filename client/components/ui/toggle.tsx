import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Варианты стилей для компонента Toggle
 *
 * @description Определяет различные варианты отображения переключателя с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.variant - Варианты внешнего вида (по умолчанию или контурный)
 * @param {object} variants.size - Варианты размеров (по умолчанию, маленький, большой)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Компонент Toggle (переключатель)
 *
 * @component
 * @description Кнопка-переключатель, которая может находиться в активном или неактивном состоянии.
 * Использует Radix UI Toggle Primitive для обеспечения доступности и функциональности.
 *
 * @param {React.Ref<HTMLButtonElement>} ref - Ссылка на DOM-элемент кнопки
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'outline'} variant - Вариант стиля переключателя
 * @param {'default' | 'sm' | 'lg'} size - Размер переключателя
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Toggle aria-label="Переключатель">
 *   <SmileIcon />
 * </Toggle>
 *
 * @example
 * // Пример с состоянием
 * <Toggle pressed={isPressed} onPressedChange={setIsPressed}>
 *   Переключить
 * </Toggle>
 *
 * @returns {JSX.Element} Элемент переключателя
 */
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

// Устанавливаем displayName для корректного отображения в инструментах разработчика
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
