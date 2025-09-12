import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Функция для определения мобильного устройства
function getIsMobile() {
  if (typeof window === 'undefined') {
    console.log('📱 getIsMobile: window undefined, returning false');
    return false;
  }
  const result = window.innerWidth < MOBILE_BREAKPOINT;
  console.log(`📱 getIsMobile: window.innerWidth=${window.innerWidth}, breakpoint=${MOBILE_BREAKPOINT}, isMobile=${result}`);
  return result;
}

export function useIsMobile() {
  // Сразу устанавливаем правильное значение, если window доступен
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    const result = getIsMobile();
    console.log(`🔧 useIsMobile INITIAL: ${result}`);
    return result;
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newValue = getIsMobile();
      console.log(`🔧 useIsMobile CHANGE: ${newValue}`);
      setIsMobile(newValue);
    }
    
    // Устанавливаем текущее значение при монтировании
    const currentValue = getIsMobile();
    console.log(`🔧 useIsMobile MOUNT: ${currentValue}`);
    setIsMobile(currentValue);
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
