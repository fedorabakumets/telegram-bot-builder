/**
 * @fileoverview Индикатор действия кнопки завершения
 *
 * Отображает информацию о действии кнопки завершения (action: complete).
 */

import { Label } from '@/components/ui/label';

/**
 * Компонент индикатора действия кнопки завершения
 *
 * @returns {JSX.Element} Индикатор действия кнопки
 */
export function ContinueButtonTypeInfo() {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
          <i className="fas fa-flag-checkered text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
            Действие
          </Label>
        </div>
      </div>
      <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gradient-to-br from-purple-100/50 to-pink-100/40 dark:from-purple-900/30 dark:to-pink-900/20 border border-purple-300/40 dark:border-purple-700/40">
        <div className="flex items-center gap-2">
          <i className="fas fa-flag-checkered text-purple-600 dark:text-purple-400 text-xs"></i>
          <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Кнопка завершения</span>
        </div>
      </div>
      <div className="text-xs text-purple-700/80 dark:text-purple-300/80 leading-relaxed">
        Завершает множественный выбор и переходит к следующему экрану
      </div>
    </div>
  );
}
