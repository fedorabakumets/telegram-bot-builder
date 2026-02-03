import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Варианты стилей для компонента Badge
 *
 * @description Определяет различные варианты отображения бейджа с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.variant - Варианты внешнего вида (по умолчанию, вторичный, разрушительный, контурный)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Интерфейс свойств компонента Badge
 *
 * @interface BadgeProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 * @extends {VariantProps<typeof badgeVariants>}
 *
 * @property {string} className - Дополнительные CSS-классы
 * @property {'default' | 'secondary' | 'destructive' | 'outline'} variant - Вариант стиля бейджа
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Компонент бейджа
 *
 * @component
 * @description Небольшой компонент для отображения метки, статуса или краткой информации.
 *
 * @param {BadgeProps} props - Свойства компонента
 * @param {string} props.className - Дополнительные CSS-классы
 * @param {'default' | 'secondary' | 'destructive' | 'outline'} props.variant - Вариант стиля бейджа
 * @param {object} props.props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Badge>Новый</Badge>
 *
 * @example
 * // Пример с вариантом
 * <Badge variant="secondary">Архивный</Badge>
 *
 * @example
 * // Пример с разрушительным стилем
 * <Badge variant="destructive">Ошибка</Badge>
 *
 * @returns {JSX.Element} Бейдж
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }