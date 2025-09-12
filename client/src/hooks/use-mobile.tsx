import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Функция для определения мобильного устройства
function getIsMobile() {
  if (typeof window === 'undefined') return false;
  
  // Используем минимальное значение из innerWidth и clientWidth
  // Это поможет корректно работать в режиме эмуляции DevTools
  const effectiveWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
  return effectiveWidth < MOBILE_BREAKPOINT;
}

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
