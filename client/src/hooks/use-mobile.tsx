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
  console.log('🚀 useIsMobile hook: Initializing...');
  
  // Сразу устанавливаем правильное значение, если window доступен
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    console.log('🚀 useIsMobile hook: Initial state calculation');
    return getIsMobile();
  })

  React.useEffect(() => {
    console.log('🚀 useIsMobile hook: useEffect triggered');
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      console.log('📱 useIsMobile: Media query changed, recalculating...');
      setIsMobile(getIsMobile())
    }
    
    // Устанавливаем текущее значение при монтировании
    console.log('🚀 useIsMobile hook: Setting initial value in useEffect');
    setIsMobile(getIsMobile())
    
    mql.addEventListener("change", onChange)
    return () => {
      console.log('🚀 useIsMobile hook: Cleanup');
      mql.removeEventListener("change", onChange);
    }
  }, [])

  console.log(`📱 useIsMobile hook: Returning ${isMobile}`);
  return isMobile
}
