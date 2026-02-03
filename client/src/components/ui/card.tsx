import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Компонент карточки
 *
 * @component
 * @description Контейнер для группировки связанного контента и действий.
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Заголовок карточки</CardTitle>
 *     <CardDescription>Описание карточки</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Содержимое карточки
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Действие</Button>
 *   </CardFooter>
 * </Card>
 *
 * @returns {JSX.Element} Карточка
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Компонент заголовка карточки
 *
 * @component
 * @description Контейнер для заголовка и описания карточки.
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <CardHeader>
 *   <CardTitle>Заголовок карточки</CardTitle>
 *   <CardDescription>Описание карточки</CardDescription>
 * </CardHeader>
 *
 * @returns {JSX.Element} Заголовок карточки
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Компонент заголовка карточки
 *
 * @component
 * @description Заголовок карточки.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <CardTitle>Заголовок карточки</CardTitle>
 *
 * @returns {JSX.Element} Заголовок карточки
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Компонент описания карточки
 *
 * @component
 * @description Описание карточки.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <CardDescription>Описание карточки</CardDescription>
 *
 * @returns {JSX.Element} Описание карточки
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Компонент содержимого карточки
 *
 * @component
 * @description Основное содержимое карточки.
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <CardContent>Содержимое карточки</CardContent>
 *
 * @returns {JSX.Element} Содержимое карточки
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Компонент нижнего колонтитула карточки
 *
 * @component
 * @description Нижняя часть карточки, обычно содержит действия.
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <CardFooter>
 *   <Button>Действие</Button>
 * </CardFooter>
 *
 * @returns {JSX.Element} Нижний колонтитул карточки
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }