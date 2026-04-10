import * as React from "react"

const MOBILE_BREAKPOINT = 768

/** Платформы Telegram Mini App считающиеся мобильными */
const TELEGRAM_MOBILE_PLATFORMS = new Set(['android', 'ios', 'android_x'])

/**
 * Определяет платформу через Telegram Mini App API если доступно.
 * @returns 'mobile' | 'desktop' | null — null если не Mini App
 */
function getTelegramPlatform(): 'mobile' | 'desktop' | null {
  const platform = (window as any).Telegram?.WebApp?.platform;
  if (!platform || platform === 'unknown') return null;
  return TELEGRAM_MOBILE_PLATFORMS.has(platform) ? 'mobile' : 'desktop';
}

/**
 * Определяет мобильное устройство.
 * Приоритет: Telegram Mini App platform → ширина экрана.
 * @returns true если мобильное устройство
 */
export function getIsMobile() {
  if (typeof window === 'undefined') return false;

  // Если открыто как Mini App — используем платформу Telegram (точнее)
  const tgPlatform = getTelegramPlatform();
  if (tgPlatform !== null) return tgPlatform === 'mobile';

  const effectiveWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
  return effectiveWidth < MOBILE_BREAKPOINT;
}

/**
 * Хук определения мобильного устройства с автоматическим обновлением.
 * Если открыто как Telegram Mini App — использует platform из WebApp API.
 * @returns true если мобильное устройство
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => getIsMobile())

  React.useEffect(() => {
    // Если Mini App — платформа не меняется, слушатель не нужен
    if (getTelegramPlatform() !== null) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(getIsMobile());

    setIsMobile(getIsMobile());
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
