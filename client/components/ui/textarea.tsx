import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Компонент многострочного текстового поля (Textarea)
 *
 * @component
 * @description Интерактивный элемент управления для ввода многострочного текста.
 *
 * @param {React.Ref<HTMLTextAreaElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Textarea placeholder="Введите ваш комментарий..." />
 *
 * @example
 * // Пример с управляемым состоянием
 * const [value, setValue] = useState("");
 * <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
 *
 * @example
 * // Пример с дополнительными атрибутами
 * <Textarea
 *   placeholder="Введите текст"
 *   rows={5}
 *   maxLength={500}
 *   className="resize-none"
 * />
 *
 * @returns {JSX.Element} Многострочное текстовое поле
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
