import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Варианты стилей для компонента Button
 *
 * @description Определяет различные варианты отображения кнопки с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.variant - Варианты внешнего вида (по умолчанию, разрушительный, контурный, вторичный, без фона, ссылка)
 * @param {object} variants.size - Варианты размеров (по умолчанию, маленький, большой, иконка)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Интерфейс свойств компонента Button
 *
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 * @extends {VariantProps<typeof buttonVariants>}
 *
 * @property {string} className - Дополнительные CSS-классы
 * @property {'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'} variant - Вариант стиля кнопки
 * @property {'default' | 'sm' | 'lg' | 'icon'} size - Размер кнопки
 * @property {boolean} asChild - Использовать дочерний компонент вместо стандартной кнопки
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Компонент кнопки
 *
 * @component
 * @description Интерактивный элемент управления, который позволяет пользователям выполнять действия.
 *
 * @param {React.Ref<HTMLButtonElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'} variant - Вариант стиля кнопки
 * @param {'default' | 'sm' | 'lg' | 'icon'} size - Размер кнопки
 * @param {boolean} asChild - Использовать дочерний компонент вместо стандартной кнопки
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Button>Нажми меня</Button>
 *
 * @example
 * // Пример с вариантом
 * <Button variant="destructive">Удалить</Button>
 *
 * @example
 * // Пример с размером
 * <Button size="sm">Маленькая кнопка</Button>
 *
 * @example
 * // Пример с иконкой
 * <Button>
 *   <PlusIcon />
 *   Добавить
 * </Button>
 *
 * @returns {JSX.Element} Кнопка
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
