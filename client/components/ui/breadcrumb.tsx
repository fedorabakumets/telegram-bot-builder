import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Компонент навигационной цепочки (Breadcrumb)
 *
 * @component
 * @description Используется для отображения пути навигации пользователя по сайту.
 *
 * @param {React.Ref<HTMLElement>} ref - Ссылка на DOM-элемент
 * @param {React.ComponentPropsWithoutRef<"nav">} props - Свойства компонента
 * @param {React.ReactNode} props.separator - Разделитель между элементами (необязательно)
 *
 * @example
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Главная</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/components">Компоненты</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>Бreadcrumbs</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 *
 * @returns {JSX.Element} Навигационная цепочка
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

/**
 * Компонент списка навигационной цепочки
 *
 * @component
 * @description Контейнер для элементов навигационной цепочки.
 *
 * @param {React.Ref<HTMLOListElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbList>
 *   <BreadcrumbItem>...</BreadcrumbItem>
 *   <BreadcrumbSeparator />
 *   <BreadcrumbItem>...</BreadcrumbItem>
 * </BreadcrumbList>
 *
 * @returns {JSX.Element} Список навигационной цепочки
 */
const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

/**
 * Компонент элемента навигационной цепочки
 *
 * @component
 * @description Отдельный элемент в навигационной цепочке.
 *
 * @param {React.Ref<HTMLLIElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbItem>
 *   <BreadcrumbLink href="/components">Компоненты</BreadcrumbLink>
 * </BreadcrumbItem>
 *
 * @returns {JSX.Element} Элемент навигационной цепочки
 */
const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

/**
 * Компонент ссылки в навигационной цепочке
 *
 * @component
 * @description Ссылка на страницу в навигационной цепочке.
 *
 * @param {React.Ref<HTMLAnchorElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} asChild - Использовать дочерний компонент вместо тега "a"
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbLink href="/components">Компоненты</BreadcrumbLink>
 *
 * @returns {JSX.Element} Ссылка в навигационной цепочке
 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

/**
 * Компонент текущей страницы в навигационной цепочке
 *
 * @component
 * @description Отображает название текущей страницы (не является ссылкой).
 *
 * @param {React.Ref<HTMLSpanElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbPage>Бreadcrumbs</BreadcrumbPage>
 *
 * @returns {JSX.Element} Текущая страница в навигационной цепочке
 */
const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

/**
 * Компонент разделителя в навигационной цепочке
 *
 * @component
 * @description Разделитель между элементами навигационной цепочки.
 *
 * @param {React.ReactNode} children - Дочерние элементы (необязательно)
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbSeparator /> // по умолчанию использует ChevronRight
 * <BreadcrumbSeparator>/</BreadcrumbSeparator> // кастомный разделитель
 *
 * @returns {JSX.Element} Разделитель в навигационной цепочке
 */
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

/**
 * Компонент многоточия в навигационной цепочке
 *
 * @component
 * @description Используется для обозначения пропущенных уровней в длинной навигационной цепочке.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <BreadcrumbEllipsis />
 *
 * @returns {JSX.Element} Многоточие в навигационной цепочке
 */
const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
