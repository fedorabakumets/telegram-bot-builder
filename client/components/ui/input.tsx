import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Компонент поля ввода
 *
 * @component
 * @description Интерактивный элемент управления для ввода текста или других данных.
 *
 * @param {React.Ref<HTMLInputElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {string} type - Тип поля ввода (text, email, password и т.д.)
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * // Простой пример использования
 * <Input type="text" placeholder="Введите текст" />
 *
 * @example
 * // Пример с email
 * <Input type="email" placeholder="Введите email" />
 *
 * @example
 * // Пример с управляемым состоянием
 * const [value, setValue] = useState("");
 * <Input value={value} onChange={(e) => setValue(e.target.value)} />
 *
 * @returns {JSX.Element} Поле ввода
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
