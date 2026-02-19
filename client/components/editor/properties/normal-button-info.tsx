/**
 * @fileoverview Информационный блок для обычной кнопки
 * 
 * Компонент отображает информацию о кнопке типа "normal" —
 * стандартной кнопке навигации без специальных функций.
 */

import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента NormalButtonInfo
 */
interface NormalButtonInfoProps {
  /** Пустой интерфейс для совместимости с другими компонентами */
  // Можно расширить в будущем
}

/**
 * Информационный блок обычной кнопки
 * 
 * @param props - Пропсы компонента
 * @returns JSX компонент информации об обычной кнопке
 */
export function NormalButtonInfo({}: NormalButtonInfoProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
          <i className="fas fa-rectangle-ad text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 cursor-pointer block">
            Обычная кнопка
          </Label>
          <div className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5 leading-snug hidden sm:block">
            Стандартная кнопка навигации
          </div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
        Работает как обычная кнопка - переход, команда или ссылка
      </div>
    </div>
  );
}
