"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Компонент формы
 *
 * @description Обертка для провайдера форм react-hook-form.
 * Представляет собой реализацию FormProvider из react-hook-form.
 *
 * @param {React.ComponentProps<typeof FormProvider>} props - Свойства компонента
 * @returns {JSX.Element} Компонент формы
 */
const Form = FormProvider

/**
 * Тип значения контекста поля формы
 *
 * @template TFieldValues - Тип значений полей формы
 * @template TName - Тип пути к полю
 * @property {TName} name - Имя поля
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

/**
 * Контекст поля формы
 *
 * @description Контекст, содержащий информацию о текущем поле формы.
 */
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

/**
 * Компонент поля формы
 *
 * @component
 * @description Обертка для контролируемого поля формы.
 *
 * @template TFieldValues - Тип значений полей формы
 * @template TName - Тип пути к полю
 * @param {ControllerProps<TFieldValues, TName>} props - Свойства компонента
 * @param {TName} props.name - Имя поля
 * @param {any} props.control - Контроллер формы
 * @param {any} props.defaultValue - Значение по умолчанию
 * @param {any} props.rules - Правила валидации
 * @param {Function} props.render - Функция рендеринга
 *
 * @example
 * <FormField
 *   control={form.control}
 *   name="email"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Email</FormLabel>
 *       <FormControl>
 *         <Input placeholder="example@email.com" {...field} />
 *       </FormControl>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 *
 * @returns {JSX.Element} Поле формы
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * Хук для получения информации о текущем поле формы
 *
 * @description Используется для получения информации о состоянии поля формы.
 *
 * @returns {{
 *   id: string,
 *   name: string,
 *   formItemId: string,
 *   formDescriptionId: string,
 *   formMessageId: string,
 *   invalid?: boolean,
 *   isDirty?: boolean,
 *   isTouched?: boolean,
 *   error?: any
 * }} Объект с информацией о поле формы
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/**
 * Тип значения контекста элемента формы
 *
 * @property {string} id - Уникальный идентификатор элемента формы
 */
type FormItemContextValue = {
  id: string
}

/**
 * Контекст элемента формы
 *
 * @description Контекст, содержащий информацию о текущем элементе формы.
 */
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/**
 * Компонент элемента формы
 *
 * @component
 * @description Контейнер для одного элемента формы (поле ввода, метка, описание и т.д.).
 *
 * @param {React.Ref<HTMLDivElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <FormItem>
 *   <FormLabel>Имя</FormLabel>
 *   <FormControl>
 *     <Input placeholder="Введите имя" />
 *   </FormControl>
 *   <FormMessage />
 * </FormItem>
 *
 * @returns {JSX.Element} Элемент формы
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

/**
 * Компонент метки формы
 *
 * @component
 * @description Метка для элемента формы.
 *
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <FormLabel>Имя пользователя</FormLabel>
 *
 * @returns {JSX.Element} Метка формы
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

/**
 * Компонент управления формой
 *
 * @component
 * @description Контролируемый элемент формы (input, textarea, select и т.д.).
 *
 * @param {React.Ref<React.ElementRef<typeof Slot>>} ref - Ссылка на DOM-элемент
 * @param {object} props - Свойства, передаваемые в компонент
 *
 * @example
 * <FormControl>
 *   <Input placeholder="Введите значение" />
 * </FormControl>
 *
 * @returns {JSX.Element} Элемент управления формой
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

/**
 * Компонент описания формы
 *
 * @component
 * @description Описание для элемента формы.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <FormDescription>Это поле обязательно для заполнения</FormDescription>
 *
 * @returns {JSX.Element} Описание формы
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

/**
 * Компонент сообщения формы
 *
 * @component
 * @description Сообщение об ошибке или статусе валидации.
 *
 * @param {React.Ref<HTMLParagraphElement>} ref - Ссылка на DOM-элемент
 * @param {string} className - Дополнительные CSS-классы
 * @param {React.ReactNode} children - Дочерние элементы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <FormMessage />
 *
 * @returns {JSX.Element} Сообщение формы
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
