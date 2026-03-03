import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Функция для определения мобильного устройства на основе ширины экрана.
 *
 * @function
 * @description
 * Проверяет, является ли устройство мобильным, сравнивая ширину окна с заданным пороговым значением.
 * Использует минимальное значение из innerWidth и clientWidth для корректной работы в режиме эмуляции DevTools.
 *
 * @returns {boolean} Возвращает true, если ширина экрана меньше порогового значения MOBILE_BREAKPOINT, иначе false.
 *
 * @example
 * // Проверка на мобильное устройство вне компонента:
 * const isMobile = getIsMobile();
 * if (isMobile) {
 *   console.log("Это мобильное устройство");
 * }
 */
export function getIsMobile() {
  if (typeof window === 'undefined') return false;

  // Используем минимальное значение из innerWidth и clientWidth
  // Это поможет корректно работать в режиме эмуляции DevTools
  const effectiveWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
  return effectiveWidth < MOBILE_BREAKPOINT;
}

/**
 * Хук для определения мобильного устройства с автоматическим обновлением при изменении размера экрана.
 *
 * @function
 * @description
 * Возвращает состояние isMobile, которое обновляется при изменении размера экрана.
 * Использует window.matchMedia для отслеживания изменений размера экрана.
 *
 * @returns {boolean} Возвращает true, если устройство является мобильным (ширина экрана меньше MOBILE_BREAKPOINT), иначе false.
 *
 * @example
 * // Использование хука в компоненте:
 * import { useIsMobile } from '@/hooks/use-mobile';
 *
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 */
export function useIsMobile() {
  // Сразу устанавливаем правильное значение, если window доступен
  const [isMobile, setIsMobile] = React.useState<boolean>(() => getIsMobile())

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(getIsMobile());
    }

    // Устанавливаем текущее значение при монтировании
    setIsMobile(getIsMobile());

    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
