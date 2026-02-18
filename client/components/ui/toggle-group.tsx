"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

/**
 * Контекст группы переключателей
 *
 * @description Контекст, предоставляющий общие свойства для всех элементов группы переключателей.
 *
 * @property {VariantProps<typeof toggleVariants>} size - Размер переключателей (по умолчанию "default")
 * @property {VariantProps<typeof toggleVariants>} variant - Вариант стиля переключателей (по умолчанию "default")
 */
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

/**
 * Компонент группы переключателей
 *
 * @component
 * @description Контейнер для набора связанных переключателей, позволяющий выбрать один или несколько вариантов.
 *
 * @param {React.Ref<React.ElementRef<typeof ToggleGroupPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'outline'} variant - Вариант стиля переключателей
 * @param {'default' | 'sm' | 'lg'} size - Размер переключателей
 * @param {React.ReactNode} children - Дочерние элементы (ToggleGroupItem)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Пример с одиночным выбором
 * <ToggleGroup type="single" defaultValue="bold" variant="outline">
 *   <ToggleGroupItem value="bold">Жирный</ToggleGroupItem>
 *   <ToggleGroupItem value="italic">Курсив</ToggleGroupItem>
 *   <ToggleGroupItem value="underline">Подчеркнутый</ToggleGroupItem>
 * </ToggleGroup>
 *
 * @example
 * // Пример с множественным выбором
 * <ToggleGroup type="multiple" variant="outline">
 *   <ToggleGroupItem value="bold">Жирный</ToggleGroupItem>
 *   <ToggleGroupItem value="italic">Курсив</ToggleGroupItem>
 *   <ToggleGroupItem value="underline">Подчеркнутый</ToggleGroupItem>
 * </ToggleGroup>
 *
 * @returns {JSX.Element} Группа переключателей
 */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

/**
 * Компонент элемента группы переключателей
 *
 * @component
 * @description Отдельный переключатель внутри группы.
 *
 * @param {React.Ref<React.ElementRef<typeof ToggleGroupPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {'default' | 'outline'} variant - Вариант стиля переключателя
 * @param {'default' | 'sm' | 'lg'} size - Размер переключателя
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <ToggleGroupItem value="bold">Жирный</ToggleGroupItem>
 *
 * @returns {JSX.Element} Элемент группы переключателей
 */
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
