import { useState, useEffect } from 'react';

/**
 * Хук для проверки соответствия медиазапросу
 *
 * @param {string} query - Медиазапрос в формате строки (например, "(max-width: 768px)")
 * @returns {boolean} true, если медиазапрос соответствует текущему окну, иначе false
 *
 * @example
 * ```typescript
 * // Проверка, соответствует ли окно мобильному размеру
 * const isMobile = useMediaQuery('(max-width: 768px)');
 *
 * // Проверка, соответствует ли окно темной теме
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * // Использование результата для условного рендеринга
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *   </div>
 * );
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}