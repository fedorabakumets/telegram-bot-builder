"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Компонент боковой панели (Sheet)
 *
 * @description Используется как контейнер для элементов боковой панели.
 * Представляет собой реализацию Radix UI Dialog Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Sheet>
 *   <SheetTrigger>Открыть панель</SheetTrigger>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Заголовок</SheetTitle>
 *       <SheetDescription>Описание</SheetDescription>
 *     </SheetHeader>
 *     <div>Содержимое панели</div>
 *   </SheetContent>
 * </Sheet>
 *
 * @returns {JSX.Element} Боковая панель
 */
const Sheet = SheetPrimitive.Root

/**
 * Компонент триггера боковой панели
 *
 * @description Используется для вызова боковой панели.
 * Представляет собой реализацию Radix UI Dialog Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>} props - Свойства компонента
 *
 * @example
 * <SheetTrigger>Открыть панель</SheetTrigger>
 *
 * @returns {JSX.Element} Триггер боковой панели
 */
const SheetTrigger = SheetPrimitive.Trigger

/**
 * Компонент закрытия боковой панели
 *
 * @description Используется для закрытия боковой панели.
 * Представляет собой реализацию Radix UI Dialog Close.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>} props - Свойства компонента
 *
 * @example
 * <SheetClose>Закрыть</SheetClose>
 *
 * @returns {JSX.Element} Компонент закрытия боковой панели
 */
const SheetClose = SheetPrimitive.Close

/**
 * Компонент портала боковой панели
 *
 * @description Используется для рендеринга содержимого панели вне обычного дерева DOM.
 * Представляет собой реализацию Radix UI Dialog Portal.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Portal>} props - Свойства компонента
 *
 * @returns {JSX.Element} Портал боковой панели
 */
const SheetPortal = SheetPrimitive.Portal

/**
 * Компонент оверлея боковой панели
 *
 * @component
 * @description Полупрозрачный фон, который появляется под боковой панелью для выделения содержимого.
 *
 * @param {React.Ref<React.ElementRef<typeof SheetPrimitive.Overlay>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetOverlay />
 *
 * @returns {JSX.Element} Оверлей боковой панели
 */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

/**
 * Варианты стилей для компонента Sheet
 *
 * @description Определяет различные варианты отображения боковой панели с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.side - Сторона экрана, откуда появляется панель (top, bottom, left, right)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:w-3/4 sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-3/4 sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

/**
 * Интерфейс свойств содержимого боковой панели
 *
 * @interface SheetContentProps
 * @extends {React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>}
 * @extends {VariantProps<typeof sheetVariants>}
 */
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

/**
 * Компонент содержимого боковой панели
 *
 * @component
 * @description Основное содержимое боковой панели.
 *
 * @param {React.Ref<React.ElementRef<typeof SheetPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {'top' | 'bottom' | 'left' | 'right'} side - Сторона экрана, откуда появляется панель (по умолчанию 'right')
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetContent side="left">
 *   <SheetHeader>
 *     <SheetTitle>Заголовок</SheetTitle>
 *     <SheetDescription>Описание</SheetDescription>
 *   </SheetHeader>
 *   <div>Содержимое панели</div>
 *   <SheetFooter>
 *     <Button>Подтвердить</Button>
 *     <Button variant="outline">Отмена</Button>
 *   </SheetFooter>
 * </SheetContent>
 *
 * @returns {JSX.Element} Содержимое боковой панели
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className="absolute right-4 top-4 z-50 rounded-md opacity-80 ring-offset-background transition-all hover:opacity-100 hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1"
        data-testid="button-sheet-close"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

/**
 * Компонент заголовка боковой панели
 *
 * @component
 * @description Контейнер для заголовка и описания боковой панели.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetHeader>
 *   <SheetTitle>Заголовок</SheetTitle>
 *   <SheetDescription>Описание</SheetDescription>
 * </SheetHeader>
 *
 * @returns {JSX.Element} Заголовок боковой панели
 */
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

/**
 * Компонент нижнего колонтитула боковой панели
 *
 * @component
 * @description Контейнер для кнопок действия в боковой панели.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetFooter>
 *   <Button>Подтвердить</Button>
 *   <Button variant="outline">Отмена</Button>
 * </SheetFooter>
 *
 * @returns {JSX.Element} Нижний колонтитул боковой панели
 */
const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

/**
 * Компонент заголовка боковой панели
 *
 * @component
 * @description Заголовок боковой панели.
 *
 * @param {React.Ref<React.ElementRef<typeof SheetPrimitive.Title>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetTitle>Важное уведомление</SheetTitle>
 *
 * @returns {JSX.Element} Заголовок боковой панели
 */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

/**
 * Компонент описания боковой панели
 *
 * @component
 * @description Описание или дополнительная информация в боковой панели.
 *
 * @param {React.Ref<React.ElementRef<typeof SheetPrimitive.Description>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SheetDescription>Дополнительная информация о боковой панели</SheetDescription>
 *
 * @returns {JSX.Element} Описание боковой панели
 */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
