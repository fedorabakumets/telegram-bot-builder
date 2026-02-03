import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

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
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200 dark:border-2 dark:border-border/80 dark:hover:border-primary/80 dark:hover:shadow-lg dark:hover:scale-105 dark:data-[state=checked]:border-primary dark:data-[state=checked]:shadow-primary/20 dark:data-[state=checked]:shadow-lg",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current transition-all duration-200 dark:drop-shadow-sm")}
    >
      <Check className="h-4 w-4 dark:font-bold dark:stroke-2" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
