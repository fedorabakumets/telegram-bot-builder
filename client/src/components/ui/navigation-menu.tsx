import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Компонент навигационного меню
 *
 * @component
 * @description Основной контейнер для навигационного меню.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenu>
 *   <NavigationMenuList>
 *     <NavigationMenuItem>
 *       <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *       <NavigationMenuContent>
 *         <NavigationMenuLink href="/products">All Products</NavigationMenuLink>
 *         <NavigationMenuLink href="/templates">Templates</NavigationMenuLink>
 *       </NavigationMenuContent>
 *     </NavigationMenuItem>
 *   </NavigationMenuList>
 * </NavigationMenu>
 *
 * @returns {JSX.Element} Навигационное меню
 */
const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

/**
 * Компонент списка навигационного меню
 *
 * @component
 * @description Контейнер для элементов навигационного меню.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.List>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenuList>
 *   <NavigationMenuItem>
 *     <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *     <NavigationMenuContent>...</NavigationMenuContent>
 *   </NavigationMenuItem>
 * </NavigationMenuList>
 *
 * @returns {JSX.Element} Список навигационного меню
 */
const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

/**
 * Компонент элемента навигационного меню
 *
 * @description Обертка для элемента навигационного меню.
 *
 * @param {React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>} props - Свойства компонента
 *
 * @example
 * <NavigationMenuItem>
 *   <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *   <NavigationMenuContent>...</NavigationMenuContent>
 * </NavigationMenuItem>
 *
 * @returns {JSX.Element} Элемент навигационного меню
 */
const NavigationMenuItem = NavigationMenuPrimitive.Item

/**
 * Стили для триггера навигационного меню
 *
 * @description Варианты стилей для элемента, который открывает подменю.
 *
 * @example
 * className={cn(navigationMenuTriggerStyle(), className)}
 */
const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
)

/**
 * Компонент триггера навигационного меню
 *
 * @component
 * @description Элемент, при клике на который открывается подменю.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.Trigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *
 * @returns {JSX.Element} Триггер навигационного меню
 */
const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

/**
 * Компонент содержимого навигационного меню
 *
 * @component
 * @description Содержимое подменю навигационного меню.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenuContent>
 *   <NavigationMenuLink href="/products">All Products</NavigationMenuLink>
 *   <NavigationMenuLink href="/templates">Templates</NavigationMenuLink>
 * </NavigationMenuContent>
 *
 * @returns {JSX.Element} Содержимое навигационного меню
 */
const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

/**
 * Компонент ссылки навигационного меню
 *
 * @description Обертка для ссылки в навигационном меню.
 *
 * @param {React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>} props - Свойства компонента
 *
 * @example
 * <NavigationMenuLink href="/products">All Products</NavigationMenuLink>
 *
 * @returns {JSX.Element} Ссылка навигационного меню
 */
const NavigationMenuLink = NavigationMenuPrimitive.Link

/**
 * Компонент области просмотра навигационного меню
 *
 * @component
 * @description Область, в которой отображается содержимое открытого подменю.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.Viewport>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenuViewport />
 *
 * @returns {JSX.Element} Область просмотра навигационного меню
 */
const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

/**
 * Компонент индикатора навигационного меню
 *
 * @component
 * @description Индикатор положения активного элемента меню.
 *
 * @param {React.Ref<React.ElementRef<typeof NavigationMenuPrimitive.Indicator>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <NavigationMenuIndicator />
 *
 * @returns {JSX.Element} Индикатор навигационного меню
 */
const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
