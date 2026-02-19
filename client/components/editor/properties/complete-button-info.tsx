/**
 * @fileoverview Информационный блок для кнопки завершения выбора
 * 
 * Компонент отображает информацию о кнопке типа "complete",
 * которая завершает множественный выбор и переходит к следующему экрану.
 */

import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента CompleteButtonInfo
 */
interface CompleteButtonInfoProps {
  /** Пустой интерфейс для совместимости с другими компонентами */
  // Можно расширить в будущем
}

/**
 * Информационный блок кнопки завершения
 * 
 * @param props - Пропсы компонента
 * @returns JSX компонент информации о кнопке завершения
 */
export function CompleteButtonInfo({}: CompleteButtonInfoProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
          <i className="fas fa-flag-checkered text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
            Кнопка завершения
          </Label>
          <div className="text-xs text-purple-700/70 dark:text-purple-300/70 mt-0.5 leading-snug hidden sm:block">
            Завершает выбор и переходит дальше
          </div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-200 leading-relaxed">
        Сохраняет все выбранные опции и переходит к следующему экрану
      </div>
    </div>
  );
}
