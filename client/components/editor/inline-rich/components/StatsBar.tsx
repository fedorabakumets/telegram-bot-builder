/**
 * @fileoverview Компонент панели статистики текста
 * @description Отображает количество слов и символов в редакторе
 */

/**
 * Свойства компонента StatsBar
 */
export interface StatsBarProps {
  /** Количество слов в тексте */
  wordCount: number;
  /** Количество символов в тексте */
  charCount: number;
}

/**
 * Панель статистики с количеством слов и символов
 */
export function StatsBar({ wordCount, charCount }: StatsBarProps) {
  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
        <i className="fas fa-align-left mr-1 sm:mr-1.5"></i>
        <span className="hidden sm:inline">{wordCount} слов</span>
        <span className="sm:hidden">{wordCount}</span>
      </span>
      <div className="w-px h-3 bg-slate-300/30 dark:bg-slate-700/30"></div>
      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
        <i className="fas fa-font mr-1 sm:mr-1.5"></i>
        <span className="hidden sm:inline">{charCount} символов</span>
        <span className="sm:hidden">{charCount}</span>
      </span>
    </div>
  );
}
