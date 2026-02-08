import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { type CheckedState } from "@radix-ui/react-checkbox"

/**
 * Основной компонент выпадающего меню
 *
 * @description Используется как контейнер для элементов выпадающего меню.
 * Представляет собой реализацию Radix UI Dropdown Menu Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>} props - Свойства компонента
 * @returns {JSX.Element} Корневой элемент выпадающего меню
 */
const DropdownMenu = DropdownMenuPrimitive.Root

/**
 * Компонент триггера выпадающего меню
 *
 * @description Используется для вызова выпадающего меню.
 * Представляет собой реализацию Radix UI Dropdown Menu Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>} props - Свойства компонента
 * @returns {JSX.Element} Триггер выпадающего меню
 */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/**
 * Компонент группы элементов выпадающего меню
 *
 * @description Используется для группировки элементов выпадающего меню.
 * Представляет собой реализацию Radix UI Dropdown Menu Group.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>} props - Свойства компонента
 * @returns {JSX.Element} Группа элементов выпадающего меню
 */
const DropdownMenuGroup = DropdownMenuPrimitive.Group

/**
 * Компонент портала выпадающего меню
 *
 * @description Используется для рендеринга содержимого меню вне обычного дерева DOM.
 * Представляет собой реализацию Radix UI Dropdown Menu Portal.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>} props - Свойства компонента
 * @returns {JSX.Element} Портал выпадающего меню
 */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

/**
 * Компонент подменю выпадающего меню
 *
 * @description Используется для создания вложенного подменю.
 * Представляет собой реализацию Radix UI Dropdown Menu Sub.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>} props - Свойства компонента
 * @returns {JSX.Element} Подменю выпадающего меню
 */
const DropdownMenuSub = DropdownMenuPrimitive.Sub

/**
 * Компонент группы радио-кнопок выпадающего меню
 *
 * @description Используется для создания группы взаимоисключающих элементов.
 * Представляет собой реализацию Radix UI Dropdown Menu RadioGroup.
 *
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>} props - Свойства компонента
 * @returns {JSX.Element} Группа радио-кнопок выпадающего меню
 */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

/**
 * Компонент триггера подменю выпадающего меню
 *
 * @component
 * @description Используется для вызова вложенного подменю.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuSubTrigger>Подменю</DropdownMenuSubTrigger>
 *
 * @returns {JSX.Element} Триггер подменю выпадающего меню
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

/**
 * Компонент содержимого подменю выпадающего меню
 *
 * @component
 * @description Содержимое вложенного подменю.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuSubContent>
 *   <DropdownMenuItem>Элемент 1</DropdownMenuItem>
 *   <DropdownMenuItem>Элемент 2</DropdownMenuItem>
 * </DropdownMenuSubContent>
 *
 * @returns {JSX.Element} Содержимое подменю выпадающего меню
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

/**
 * Компонент содержимого выпадающего меню
 *
 * @component
 * @description Основное содержимое выпадающего меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {number} sideOffset - Смещение содержимого относительно триггера (по умолчанию 4)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuContent>
 *   <DropdownMenuItem>Элемент 1</DropdownMenuItem>
 *   <DropdownMenuItem>Элемент 2</DropdownMenuItem>
 *   <DropdownMenuSeparator />
 *   <DropdownMenuItem>Элемент 3</DropdownMenuItem>
 * </DropdownMenuContent>
 *
 * @returns {JSX.Element} Содержимое выпадающего меню
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

/**
 * Компонент элемента выпадающего меню
 *
 * @component
 * @description Отдельный элемент в выпадающем меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuItem>Сохранить</DropdownMenuItem>
 *
 * @returns {JSX.Element} Элемент выпадающего меню
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

/**
 * Компонент чекбокса в выпадающем меню
 *
 * @component
 * @description Элемент с чекбоксом в выпадающем меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {boolean} checked - Состояние чекбокса
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuCheckboxItem checked={isChecked} onCheckedChange={setChecked}>
 *   Включить уведомления
 * </DropdownMenuCheckboxItem>
 *
 * @returns {JSX.Element} Чекбокс в выпадающем меню
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  Omit<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>, 'checked'> & {
    checked?: CheckedState | undefined;
  }
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

/**
 * Компонент радио-кнопки в выпадающем меню
 *
 * @component
 * @description Элемент с радио-кнопкой в выпадающем меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuRadioGroup value={selectedValue} onValueChange={setSelectedValue}>
 *   <DropdownMenuRadioItem value="option1">Опция 1</DropdownMenuRadioItem>
 *   <DropdownMenuRadioItem value="option2">Опция 2</DropdownMenuRadioItem>
 * </DropdownMenuRadioGroup>
 *
 * @returns {JSX.Element} Радио-кнопка в выпадающем меню
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

/**
 * Компонент метки в выпадающем меню
 *
 * @component
 * @description Метка для группировки элементов выпадающего меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {boolean} inset - Добавить отступ слева
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuLabel>Настройки</DropdownMenuLabel>
 *
 * @returns {JSX.Element} Метка в выпадающем меню
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

/**
 * Компонент разделителя в выпадающем меню
 *
 * @component
 * @description Горизонтальная линия для разделения элементов меню.
 *
 * @param {React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuSeparator />
 *
 * @returns {JSX.Element} Разделитель в выпадающем меню
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

/**
 * Компонент горячей клавиши в выпадающем меню
 *
 * @component
 * @description Отображает сочетание клавиш для элемента меню.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <DropdownMenuItem>
 *   Копировать
 *   <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
 * </DropdownMenuItem>
 *
 * @returns {JSX.Element} Горячая клавиша в выпадающем меню
 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
