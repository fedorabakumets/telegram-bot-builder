"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Основной компонент диалогового окна
 *
 * @description Используется как контейнер для элементов диалогового окна.
 * Представляет собой реализацию Radix UI Dialog Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>} props - Свойства компонента
 * @returns {JSX.Element} Корневой элемент диалога
 */
const Dialog = DialogPrimitive.Root

/**
 * Компонент триггера диалогового окна
 *
 * @description Используется для вызова диалогового окна.
 * Представляет собой реализацию Radix UI Dialog Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>} props - Свойства компонента
 * @returns {JSX.Element} Триггер диалога
 */
const DialogTrigger = DialogPrimitive.Trigger

/**
 * Компонент портала диалогового окна
 *
 * @description Используется для рендеринга содержимого диалога вне обычного дерева DOM.
 * Представляет собой реализацию Radix UI Dialog Portal.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>} props - Свойства компонента
 * @returns {JSX.Element} Портал диалога
 */
const DialogPortal = DialogPrimitive.Portal

/**
 * Компонент закрытия диалогового окна
 *
 * @description Используется для закрытия диалогового окна.
 * Представляет собой реализацию Radix UI Dialog Close.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>} props - Свойства компонента
 * @returns {JSX.Element} Компонент закрытия диалога
 */
const DialogClose = DialogPrimitive.Close

/**
 * Компонент оверлея диалогового окна
 *
 * @component
 * @description Полупрозрачный фон, который появляется под диалоговым окном для выделения содержимого.
 *
 * @param {React.Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogOverlay />
 *
 * @returns {JSX.Element} Оверлей диалога
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Компонент содержимого диалогового окна
 *
 * @component
 * @description Основное содержимое диалогового окна.
 *
 * @param {React.Ref<React.ElementRef<typeof DialogPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogContent>
 *   <DialogHeader>
 *     <DialogTitle>Заголовок</DialogTitle>
 *     <DialogDescription>Описание</DialogDescription>
 *   </DialogHeader>
 *   <DialogFooter>
 *     <Button>Подтвердить</Button>
 *     <Button variant="outline">Отмена</Button>
 *   </DialogFooter>
 * </DialogContent>
 *
 * @returns {JSX.Element} Содержимое диалога
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] sm:w-full sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * Компонент заголовка диалогового окна
 *
 * @component
 * @description Контейнер для заголовка и описания диалога.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogHeader>
 *   <DialogTitle>Заголовок</DialogTitle>
 *   <DialogDescription>Описание</DialogDescription>
 * </DialogHeader>
 *
 * @returns {JSX.Element} Заголовок диалога
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

/**
 * Компонент нижнего колонтитула диалогового окна
 *
 * @component
 * @description Контейнер для кнопок действия в диалоге.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogFooter>
 *   <Button>Подтвердить</Button>
 *   <Button variant="outline">Отмена</Button>
 * </DialogFooter>
 *
 * @returns {JSX.Element} Нижний колонтитул диалога
 */
const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter"

/**
 * Компонент заголовка диалогового окна
 *
 * @component
 * @description Заголовок диалогового окна.
 *
 * @param {React.Ref<React.ElementRef<typeof DialogPrimitive.Title>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogTitle>Важное уведомление</DialogTitle>
 *
 * @returns {JSX.Element} Заголовок диалога
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * Компонент описания диалогового окна
 *
 * @component
 * @description Описание или дополнительная информация в диалоговом окне.
 *
 * @param {React.Ref<React.ElementRef<typeof DialogPrimitive.Description>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DialogDescription>Дополнительная информация о диалоге</DialogDescription>
 *
 * @returns {JSX.Element} Описание диалога
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
