import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Компонент переключателя (Switch)
 *
 * @component
 * @description Интерактивный элемент управления для включения/выключения определенного параметра.
 *
 * @param {React.Ref<React.ElementRef<typeof SwitchPrimitives.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * @example
 * // Пример с меткой
 * <div className="flex items-center space-x-2">
 *   <Switch id="airplane-mode" checked={airplaneMode} onCheckedChange={setAirplaneMode} />
 *   <Label htmlFor="airplane-mode">Режим в самолете</Label>
 * </div>
 *
 * @returns {JSX.Element} Переключатель
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:border-border/50 dark:data-[state=unchecked]:bg-muted/30",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-all duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:border dark:border-border/60 dark:shadow-xl dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-background"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
