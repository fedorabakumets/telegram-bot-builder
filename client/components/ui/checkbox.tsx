/** @fileoverview Общий контрастный флажок Radix с отметками выбора и частичного выбора. */
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/utils/utils"

/**
 * Компонент чекбокса
 *
 * @component
 * @description Интерактивный элемент управления, позволяющий пользователю выбирать один или несколько вариантов из списка.
 *
 * @param {React.Ref<React.ElementRef<typeof CheckboxPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Checkbox id="terms" />
 * <label htmlFor="terms">Согласен с условиями</label>
 *
 * @example
 * // Пример с управляемым состоянием
 * const [checked, setChecked] = useState(false);
 *
 * <Checkbox
 *   checked={checked}
 *   onCheckedChange={(value) => setChecked(value as boolean)}
 * />
 *
 * @returns {JSX.Element} Чекбокс
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border-2 ring-offset-background disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className="flex items-center justify-center text-current"
    >
      {props.checked === 'indeterminate' ? <Minus className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
