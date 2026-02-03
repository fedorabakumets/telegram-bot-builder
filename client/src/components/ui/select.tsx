"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Компонент выпадающего списка
 *
 * @description Используется как контейнер для элементов выпадающего списка.
 * Представляет собой реализацию Radix UI Select Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Select value={selectedValue} onValueChange={setSelectedValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Выберите опцию" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Опция 1</SelectItem>
 *     <SelectItem value="option2">Опция 2</SelectItem>
 *   </SelectContent>
 * </Select>
 *
 * @returns {JSX.Element} Выпадающий список
 */
const Select = SelectPrimitive.Root

/**
 * Компонент группы элементов выпадающего списка
 *
 * @description Используется для группировки элементов выпадающего списка.
 * Представляет собой реализацию Radix UI Select Group.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>} props - Свойства компонента
 *
 * @example
 * <SelectGroup>
 *   <SelectLabel>Группа 1</SelectLabel>
 *   <SelectItem value="option1">Опция 1</SelectItem>
 *   <SelectItem value="option2">Опция 2</SelectItem>
 * </SelectGroup>
 *
 * @returns {JSX.Element} Группа элементов выпадающего списка
 */
const SelectGroup = SelectPrimitive.Group

/**
 * Компонент значения выпадающего списка
 *
 * @description Отображает выбранное значение или плейсхолдер.
 * Представляет собой реализацию Radix UI Select Value.
 *
 * @param {React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>} props - Свойства компонента
 *
 * @example
 * <SelectValue placeholder="Выберите опцию" />
 *
 * @returns {JSX.Element} Значение выпадающего списка
 */
const SelectValue = SelectPrimitive.Value

/**
 * Компонент триггера выпадающего списка
 *
 * @component
 * @description Элемент, при клике на который открывается список опций.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectTrigger>
 *   <SelectValue placeholder="Выберите опцию" />
 * </SelectTrigger>
 *
 * @returns {JSX.Element} Триггер выпадающего списка
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Компонент кнопки прокрутки вверх выпадающего списка
 *
 * @component
 * @description Кнопка для прокрутки содержимого списка вверх.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectScrollUpButton />
 *
 * @returns {JSX.Element} Кнопка прокрутки вверх
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

/**
 * Компонент кнопки прокрутки вниз выпадающего списка
 *
 * @component
 * @description Кнопка для прокрутки содержимого списка вниз.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectScrollDownButton />
 *
 * @returns {JSX.Element} Кнопка прокрутки вниз
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

/**
 * Компонент содержимого выпадающего списка
 *
 * @component
 * @description Контейнер для элементов списка.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'popper' | 'item-aligned'} position - Позиционирование содержимого (по умолчанию 'popper')
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectContent>
 *   <SelectItem value="option1">Опция 1</SelectItem>
 *   <SelectItem value="option2">Опция 2</SelectItem>
 * </SelectContent>
 *
 * @returns {JSX.Element} Содержимое выпадающего списка
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

/**
 * Компонент метки выпадающего списка
 *
 * @component
 * @description Метка для группировки элементов списка.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.Label>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectLabel>Группа опций</SelectLabel>
 *
 * @returns {JSX.Element} Метка выпадающего списка
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

/**
 * Компонент элемента выпадающего списка
 *
 * @component
 * @description Отдельный элемент в списке опций.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectItem value="option1">Опция 1</SelectItem>
 *
 * @returns {JSX.Element} Элемент выпадающего списка
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

/**
 * Компонент разделителя выпадающего списка
 *
 * @component
 * @description Горизонтальная линия для разделения элементов списка.
 *
 * @param {React.Ref<React.ElementRef<typeof SelectPrimitive.Separator>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <SelectSeparator />
 *
 * @returns {JSX.Element} Разделитель выпадающего списка
 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
