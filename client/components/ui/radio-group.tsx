import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Компонент группы радио-кнопок
 *
 * @component
 * @description Контейнер для набора радио-кнопок, позволяющий выбрать только один вариант.
 *
 * @param {React.Ref<React.ElementRef<typeof RadioGroupPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option1" id="option1" />
 *     <Label htmlFor="option1">Опция 1</Label>
 *   </div>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option2" id="option2" />
 *     <Label htmlFor="option2">Опция 2</Label>
 *   </div>
 * </RadioGroup>
 *
 * @returns {JSX.Element} Группа радио-кнопок
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

/**
 * Компонент элемента группы радио-кнопок
 *
 * @component
 * @description Отдельная радио-кнопка в группе.
 *
 * @param {React.Ref<React.ElementRef<typeof RadioGroupPrimitive.Item>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <RadioGroupItem value="option1" id="option1" />
 *
 * @returns {JSX.Element} Элемент группы радио-кнопок
 */
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
