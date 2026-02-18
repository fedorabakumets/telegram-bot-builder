import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Варианты стилей для компонента Alert
 *
 * @description Определяет различные варианты отображения уведомления с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.variant - Варианты внешнего вида (по умолчанию или разрушительный)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Компонент уведомления (Alert)
 *
 * @component
 * @description Компонент для отображения важной информации пользователю.
 * Может использоваться для отображения уведомлений, ошибок или предупреждений.
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'destructive'} variant - Вариант стиля уведомления
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Alert>
 *   <Terminal className="h-4 w-4" />
 *   <AlertTitle>Заголовок уведомления</AlertTitle>
 *   <AlertDescription>Описание уведомления</AlertDescription>
 * </Alert>
 *
 * @example
 * // Пример с разрушительным стилем
 * <Alert variant="destructive">
 *   <XCircle className="h-4 w-4" />
 *   <AlertTitle>Ошибка</AlertTitle>
 *   <AlertDescription>Произошла ошибка</AlertDescription>
 * </Alert>
 *
 * @returns {JSX.Element} Элемент уведомления
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

/**
 * Компонент заголовка уведомления
 *
 * @component
 * @description Заголовок для компонента уведомления.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertTitle>Важное уведомление</AlertTitle>
 *
 * @returns {JSX.Element} Заголовок уведомления
 */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

/**
 * Компонент описания уведомления
 *
 * @component
 * @description Описание или дополнительная информация для компонента уведомления.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDescription>Дополнительная информация об уведомлении</AlertDescription>
 *
 * @returns {JSX.Element} Описание уведомления
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
