import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

/**
 * Компонент соотношения сторон
 *
 * @component
 * @description Используется для создания контейнера с фиксированным соотношением сторон.
 * Обертывает Radix UI Aspect Ratio Root.
 *
 * @param {React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>} props - Свойства компонента
 * @param {string} props.ratio - Соотношение сторон (например, 16/9, 4/3)
 *
 * @example
 * <AspectRatio ratio={16 / 9}>
 *   <img
 *     src="image.jpg"
 *     alt="Описание изображения"
 *     className="rounded-md object-cover w-full h-full"
 *   />
 * </AspectRatio>
 *
 * @returns {JSX.Element} Контейнер с фиксированным соотношением сторон
 */
const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
