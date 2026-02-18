"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { type CheckedState } from "@radix-ui/react-checkbox"

/**
 * Компонент меню в строке меню
 *
 * @description Обертка для элемента меню строки меню.
 *
 * @param {React.ComponentProps<typeof MenubarPrimitive.Menu>} props - Свойства компонента
 *
 * @example
 * <MenubarMenu>
 *   <MenubarTrigger>Файл</MenubarTrigger>
 *   <MenubarContent>
 *     <MenubarItem>Новый</MenubarItem>
 *     <MenubarItem>Открыть</MenubarItem>
 *     <MenubarSeparator />
 *     <MenubarItem>Сохранить</MenubarItem>
 *   </MenubarContent>
 * </MenubarMenu>
 *
 * @returns {JSX.Element} Меню в строке меню
 */
function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

/**
 * Компонент группы элементов строки меню
 *
 * @description Обертка для группы элементов строки меню.
 *
 * @param {React.ComponentProps<typeof MenubarPrimitive.Group>} props - Свойства компонента
 *
 * @returns {JSX.Element} Группа элементов строки меню
 */
function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

/**
 * Компонент портала строки меню
 *
 * @description Обертка для портала строки меню.
 *
 * @param {React.ComponentProps<typeof MenubarPrimitive.Portal>} props - Свойства компонента
 *
 * @returns {JSX.Element} Портал строки меню
 */
function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

/**
 * Компонент группы радио-кнопок строки меню
 *
 * @description Обертка для группы радио-кнопок строки меню.
 *
 * @param {React.ComponentProps<typeof MenubarPrimitive.RadioGroup>} props - Свойства компонента
 *
 * @returns {JSX.Element} Группа радио-кнопок строки меню
 */
function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

/**
 * Компонент подменю строки меню
 *
 * @description Обертка для подменю строки меню.
 *
 * @param {React.ComponentProps<typeof MenubarPrimitive.Sub>} props - Свойства компонента
 *
 * @returns {JSX.Element} Подменю строки меню
 */
function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

/**
 * Компонент строки меню
 *
 * @component
 * @description Основной контейнер для строки меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <Menubar>
 *   <MenubarMenu>
 *     <MenubarTrigger>Файл</MenubarTrigger>
 *     <MenubarContent>
 *       <MenubarItem>Новый</MenubarItem>
 *       <MenubarItem>Открыть</MenubarItem>
 *     </MenubarContent>
 *   </MenubarMenu>
 * </Menubar>
 *
 * @returns {JSX.Element} Строка меню
 */
const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

/**
 * Компонент триггера строки меню
 *
 * @component
 * @description Элемент, при клике на который открывается меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Trigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarTrigger>Файл</MenubarTrigger>
 *
 * @returns {JSX.Element} Триггер строки меню
 */
const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

/**
 * Компонент триггера подменю строки меню
 *
 * @component
 * @description Элемент, при клике на который открывается подменю.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.SubTrigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarSubTrigger>Подменю</MenubarSubTrigger>
 *
 * @returns {JSX.Element} Триггер подменю строки меню
 */
const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

/**
 * Компонент содержимого подменю строки меню
 *
 * @component
 * @description Содержимое подменю строки меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.SubContent>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarSubContent>
 *   <MenubarItem>Элемент 1</MenubarItem>
 *   <MenubarItem>Элемент 2</MenubarItem>
 * </MenubarSubContent>
 *
 * @returns {JSX.Element} Содержимое подменю строки меню
 */
const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

/**
 * Компонент содержимого меню строки меню
 *
 * @component
 * @description Содержимое меню строки меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'start' | 'center' | 'end'} align - Выравнивание меню (по умолчанию 'start')
 * @param {number} alignOffset - Смещение выравнивания (по умолчанию -4)
 * @param {number} sideOffset - Смещение стороны (по умолчанию 8)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarContent>
 *   <MenubarItem>Новый</MenubarItem>
 *   <MenubarItem>Открыть</MenubarItem>
 *   <MenubarSeparator />
 *   <MenubarItem>Сохранить</MenubarItem>
 * </MenubarContent>
 *
 * @returns {JSX.Element} Содержимое меню строки меню
 */
const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

/**
 * Компонент элемента строки меню
 *
 * @component
 * @description Отдельный элемент в строке меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarItem>Сохранить</MenubarItem>
 *
 * @returns {JSX.Element} Элемент строки меню
 */
const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

/**
 * Компонент чекбокса в строке меню
 *
 * @component
 * @description Элемент с чекбоксом в строке меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.CheckboxItem>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {boolean} checked - Состояние чекбокса
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarCheckboxItem checked={isChecked} onCheckedChange={setChecked}>
 *   Показывать миниатюры
 * </MenubarCheckboxItem>
 *
 * @returns {JSX.Element} Чекбокс в строке меню
 */
const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  Omit<React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>, 'checked'> & {
    checked?: CheckedState | undefined;
  }
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

/**
 * Компонент радио-кнопки в строке меню
 *
 * @component
 * @description Элемент с радио-кнопкой в строке меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.RadioItem>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarRadioGroup value={selectedTheme} onValueChange={setTheme}>
 *   <MenubarRadioItem value="light">Светлая тема</MenubarRadioItem>
 *   <MenubarRadioItem value="dark">Темная тема</MenubarRadioItem>
 * </MenubarRadioGroup>
 *
 * @returns {JSX.Element} Радио-кнопка в строке меню
 */
const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

/**
 * Компонент метки в строке меню
 *
 * @component
 * @description Метка для группировки элементов строки меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Label>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarLabel>Настройки</MenubarLabel>
 *
 * @returns {JSX.Element} Метка в строке меню
 */
const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

/**
 * Компонент разделителя в строке меню
 *
 * @component
 * @description Горизонтальная линия для разделения элементов строки меню.
 *
 * @param {React.Ref<React.ElementRef<typeof MenubarPrimitive.Separator>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarSeparator />
 *
 * @returns {JSX.Element} Разделитель в строке меню
 */
const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

/**
 * Компонент горячей клавиши в строке меню
 *
 * @component
 * @description Отображает сочетание клавиш для элемента строки меню.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <MenubarItem>
 *   Копировать
 *   <MenubarShortcut>Ctrl+C</MenubarShortcut>
 * </MenubarItem>
 *
 * @returns {JSX.Element} Горячая клавиша в строке меню
 */
const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
