import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Варианты стилей для компонента Label
 *
 * @description Определяет различные варианты отображения метки с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * Компонент метки
 *
 * @component
 * @description Метка для элемента формы, связанная с ним через htmlFor.
 *
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <div>
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" />
 * </div>
 *
 * @example
 * // Пример с дополнительными классами
 * <Label className="text-lg font-bold" htmlFor="name">Имя</Label>
 * <Input id="name" type="text" />
 *
 * @returns {JSX.Element} Метка
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
