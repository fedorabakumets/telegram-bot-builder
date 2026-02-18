import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Основной компонент диалогового окна предупреждения
 *
 * @description Используется как контейнер для элементов диалогового окна предупреждения.
 * Представляет собой реализацию Radix UI Alert Dialog Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>} props - Свойства компонента
 * @returns {JSX.Element} Корневой элемент диалога предупреждения
 */
const AlertDialog = AlertDialogPrimitive.Root

/**
 * Компонент триггера диалогового окна предупреждения
 *
 * @description Используется для вызова диалогового окна предупреждения.
 * Представляет собой реализацию Radix UI Alert Dialog Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger>} props - Свойства компонента
 * @returns {JSX.Element} Триггер диалога предупреждения
 */
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/**
 * Компонент портала диалогового окна предупреждения
 *
 * @description Используется для рендеринга содержимого диалога вне обычного дерева DOM.
 * Представляет собой реализацию Radix UI Alert Dialog Portal.
 *
 * @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Portal>} props - Свойства компонента
 * @returns {JSX.Element} Портал диалога предупреждения
 */
const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * Компонент оверлея диалогового окна предупреждения
 *
 * @component
 * @description Полупрозрачный фон, который появляется под диалоговым окном для выделения содержимого.
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogOverlay />
 *
 * @returns {JSX.Element} Оверлей диалога предупреждения
 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * Компонент содержимого диалогового окна предупреждения
 *
 * @component
 * @description Основное содержимое диалогового окна предупреждения.
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogContent>
 *   <AlertDialogHeader>
 *     <AlertDialogTitle>Заголовок</AlertDialogTitle>
 *     <AlertDialogDescription>Описание</AlertDialogDescription>
 *   </AlertDialogHeader>
 *   <AlertDialogFooter>
 *     <AlertDialogCancel>Отмена</AlertDialogCancel>
 *     <AlertDialogAction>Подтвердить</AlertDialogAction>
 *   </AlertDialogFooter>
 * </AlertDialogContent>
 *
 * @returns {JSX.Element} Содержимое диалога предупреждения
 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/**
 * Компонент заголовка диалогового окна предупреждения
 *
 * @component
 * @description Контейнер для заголовка и описания диалога.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogHeader>
 *   <AlertDialogTitle>Заголовок</AlertDialogTitle>
 *   <AlertDialogDescription>Описание</AlertDialogDescription>
 * </AlertDialogHeader>
 *
 * @returns {JSX.Element} Заголовок диалога предупреждения
 */
const AlertDialogHeader = ({
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
AlertDialogHeader.displayName = "AlertDialogHeader"

/**
 * Компонент нижнего колонтитула диалогового окна предупреждения
 *
 * @component
 * @description Контейнер для кнопок действия в диалоге.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogFooter>
 *   <AlertDialogCancel>Отмена</AlertDialogCancel>
 *   <AlertDialogAction>Подтвердить</AlertDialogAction>
 * </AlertDialogFooter>
 *
 * @returns {JSX.Element} Нижний колонтитул диалога предупреждения
 */
const AlertDialogFooter = ({
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
AlertDialogFooter.displayName = "AlertDialogFooter"

/**
 * Компонент заголовка диалогового окна предупреждения
 *
 * @component
 * @description Заголовок диалогового окна предупреждения.
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogTitle>Внимание!</AlertDialogTitle>
 *
 * @returns {JSX.Element} Заголовок диалога предупреждения
 */
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

/**
 * Компонент описания диалогового окна предупреждения
 *
 * @component
 * @description Описание или дополнительная информация в диалоговом окне.
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogDescription>Вы уверены, что хотите удалить этот элемент?</AlertDialogDescription>
 *
 * @returns {JSX.Element} Описание диалога предупреждения
 */
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

/**
 * Компонент кнопки действия диалогового окна предупреждения
 *
 * @component
 * @description Кнопка основного действия в диалоговом окне (например, "Подтвердить").
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogAction onClick={() => console.log('Подтверждено')}>Подтвердить</AlertDialogAction>
 *
 * @returns {JSX.Element} Кнопка действия диалога предупреждения
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

/**
 * Компонент кнопки отмены диалогового окна предупреждения
 *
 * @component
 * @description Кнопка отмены действия в диалоговом окне (например, "Отмена").
 *
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AlertDialogCancel onClick={() => console.log('Отменено')}>Отмена</AlertDialogCancel>
 *
 * @returns {JSX.Element} Кнопка отмены диалога предупреждения
 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
