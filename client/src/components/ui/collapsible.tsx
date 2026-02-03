"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/**
 * Компонент сворачиваемого контента
 *
 * @component
 * @description Контейнер для сворачиваемого/разворачиваемого контента.
 * Обертывает Radix UI Collapsible Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>} props - Свойства компонента
 *
 * @example
 * <Collapsible open={isOpen} onOpenChange={setIsOpen}>
 *   <CollapsibleTrigger>Развернуть</CollapsibleTrigger>
 *   <CollapsibleContent>
 *     Скрытый контент
 *   </CollapsibleContent>
 * </Collapsible>
 *
 * @returns {JSX.Element} Сворачиваемый контент
 */
const Collapsible = CollapsiblePrimitive.Root

/**
 * Компонент триггера сворачивания
 *
 * @component
 * @description Элемент, при клике на который происходит сворачивание/разворачивание контента.
 * Обертывает Radix UI Collapsible Trigger.
 *
 * @param {React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>} props - Свойства компонента
 *
 * @example
 * <CollapsibleTrigger>Развернуть</CollapsibleTrigger>
 *
 * @returns {JSX.Element} Триггер сворачивания
 */
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

/**
 * Компонент содержимого сворачиваемого контента
 *
 * @component
 * @description Содержимое, которое будет скрываться/показываться при сворачивании.
 * Обертывает Radix UI Collapsible Content.
 *
 * @param {React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>} props - Свойства компонента
 *
 * @example
 * <CollapsibleContent>
 *   Скрытый контент
 * </CollapsibleContent>
 *
 * @returns {JSX.Element} Содержимое сворачиваемого контента
 */
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
