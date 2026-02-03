import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Провайдер тостов
 *
 * @description Используется для предоставления контекста тостов.
 * Представляет собой реализацию Radix UI Toast Provider.
 *
 * @param {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Provider>} props - Свойства компонента
 *
 * @example
 * <ToastProvider>
 *   <App />
 *   <ToastViewport />
 * </ToastProvider>
 *
 * @returns {JSX.Element} Провайдер тостов
 */
const ToastProvider = ToastPrimitives.Provider

/**
 * Компонент области просмотра тостов
 *
 * @component
 * @description Область, где будут отображаться тосты.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Viewport>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToastViewport />
 *
 * @returns {JSX.Element} Область просмотра тостов
 */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

/**
 * Варианты стилей для компонента Toast
 *
 * @description Определяет различные варианты отображения тоста с помощью class-variance-authority
 *
 * @param {object} variants - Объект, определяющий варианты стилей
 * @param {object} variants.variant - Варианты внешнего вида (по умолчанию или разрушительный)
 * @param {object} defaultVariants - Значения по умолчанию для вариантов
 */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Компонент тоста
 *
 * @component
 * @description Всплывающее уведомление для отображения информации пользователю.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'destructive'} variant - Вариант стиля тоста
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <Toast open={open} onOpenChange={setOpen}>
 *   <ToastTitle>Заголовок тоста</ToastTitle>
 *   <ToastDescription>Описание тоста</ToastDescription>
 *   <ToastAction altText="Отмена">Отмена</ToastAction>
 * </Toast>
 *
 * @returns {JSX.Element} Тост
 */
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

/**
 * Компонент действия тоста
 *
 * @component
 * @description Кнопка действия внутри тоста.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Action>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToastAction altText="Повторить">Повторить</ToastAction>
 *
 * @returns {JSX.Element} Действие тоста
 */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

/**
 * Компонент закрытия тоста
 *
 * @component
 * @description Кнопка для закрытия тоста.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Close>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToastClose />
 *
 * @returns {JSX.Element} Закрытие тоста
 */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

/**
 * Компонент заголовка тоста
 *
 * @component
 * @description Заголовок тоста.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Title>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToastTitle>Успешно сохранено</ToastTitle>
 *
 * @returns {JSX.Element} Заголовок тоста
 */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

/**
 * Компонент описания тоста
 *
 * @component
 * @description Описание тоста.
 *
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Description>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToastDescription>Файл успешно загружен</ToastDescription>
 *
 * @returns {JSX.Element} Описание тоста
 */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

/**
 * Тип свойств тоста
 *
 * @typedef {React.ComponentPropsWithoutRef<typeof Toast>} ToastProps
 */
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

/**
 * Тип элемента действия тоста
 *
 * @typedef {React.ReactElement<typeof ToastAction>} ToastActionElement
 */
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
