/**
 * @fileoverview Информационный блок о разработке раздела
 *
 * Компонент отображает предупреждение о том, что раздел находится
 * в разработке.
 *
 * Используется в секциях, функционал которых ещё не полностью реализован.
 *
 * @module DevelopmentNoticeBlock
 */

/**
 * Пропсы компонента DevelopmentNoticeBlock
 */
interface DevelopmentNoticeBlockProps {
  /** Заголовок предупреждения */
  title?: string;
}

/**
 * Компонент информационного блока о разработке раздела
 *
 * Отображает иконку предупреждения и заголовок о разработке.
 *
 * @param {DevelopmentNoticeBlockProps} props - Пропсы компонента
 * @returns {JSX.Element} Информационный блок о разработке
 */
export function DevelopmentNoticeBlock({
  title = '⚠️ Раздел в разработке'
}: DevelopmentNoticeBlockProps) {
  return (
    <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
      <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
      <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
        <span className="font-semibold">{title}</span>
      </p>
    </div>
  );
}
