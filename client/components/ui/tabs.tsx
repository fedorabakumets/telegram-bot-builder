import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Компонент вкладок (Tabs)
 *
 * @description Используется как контейнер для элементов вкладок.
 * Представляет собой реализацию Radix UI Tabs Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Tabs defaultValue="account" className="w-[400px]">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Make changes to your account here.</TabsContent>
 *   <TabsContent value="password">Change your password here.</TabsContent>
 * </Tabs>
 *
 * @returns {JSX.Element} Вкладки
 */
const Tabs = TabsPrimitive.Root

/**
 * Компонент списка вкладок
 *
 * @component
 * @description Контейнер для триггеров вкладок.
 *
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.List>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <TabsList>
 *   <TabsTrigger value="tab1">Вкладка 1</TabsTrigger>
 *   <TabsTrigger value="tab2">Вкладка 2</TabsTrigger>
 * </TabsList>
 *
 * @returns {JSX.Element} Список вкладок
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * Компонент триггера вкладки
 *
 * @component
 * @description Элемент, при клике на который отображается соответствующее содержимое вкладки.
 *
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <TabsTrigger value="profile">Профиль</TabsTrigger>
 *
 * @returns {JSX.Element} Триггер вкладки
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * Компонент содержимого вкладки
 *
 * @component
 * @description Содержимое, которое отображается при активации соответствующей вкладки.
 *
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <TabsContent value="profile">
 *   <p>Содержимое профильной вкладки</p>
 * </TabsContent>
 *
 * @returns {JSX.Element} Содержимое вкладки
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }