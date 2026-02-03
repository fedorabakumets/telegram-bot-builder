import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Основной компонент аккордеона
 *
 * @description Используется как контейнер для элементов аккордеона.
 * Представляет собой реализацию Radix UI Accordion Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>} props - Свойства компонента
 * @returns {JSX.Element} Корневой элемент аккордеона
 */
const Accordion = AccordionPrimitive.Root

/**
 * Компонент элемента аккордеона
 *
 * @component
 * @description Отдельный элемент внутри аккордеона, который может быть раскрыт или свернут.
 *
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AccordionItem value="item-1">
 *   <AccordionTrigger>Заголовок</AccordionTrigger>
 *   <AccordionContent>Содержимое</AccordionContent>
 * </AccordionItem>
 *
 * @returns {JSX.Element} Элемент аккордеона
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-border", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

/**
 * Компонент триггера аккордеона (заголовок с возможностью раскрытия)
 *
 * @component
 * @description Заголовок элемента аккордеона, при клике на который происходит раскрытие/сворачивание содержимого.
 *
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Trigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы (обычно текст заголовка)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AccordionTrigger>Заголовок аккордеона</AccordionTrigger>
 *
 * @returns {JSX.Element} Триггер аккордеона
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:no-underline hover:bg-muted/50 rounded-lg px-2 text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "[&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:bg-muted/30",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 text-muted-foreground group-hover:text-foreground" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

/**
 * Компонент содержимого аккордеона
 *
 * @component
 * @description Содержимое элемента аккордеона, которое показывается или скрывается при нажатии на триггер.
 *
 * @param {React.Ref<React.ElementRef<typeof AccordionPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы (содержимое аккордеона)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <AccordionContent>Содержимое аккордеона</AccordionContent>
 *
 * @returns {JSX.Element} Содержимое аккордеона
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
