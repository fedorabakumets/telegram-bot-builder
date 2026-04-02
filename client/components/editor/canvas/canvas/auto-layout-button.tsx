/**
 * @fileoverview Компонент кнопки авто-расстановки узлов на холсте
 *
 * Содержит кнопку для автоматической иерархической расстановки
 * всех узлов на холсте с сохранением действия в историю.
 */

/**
 * Свойства компонента кнопки авто-расстановки
 */
interface AutoLayoutButtonProps {
  /** Колбэк для запуска авто-расстановки узлов */
  onAutoLayout?: () => void;
}

/**
 * Компонент кнопки авто-расстановки узлов
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки авто-расстановки или null если колбэк не передан
 */
export function AutoLayoutButton({ onAutoLayout }: AutoLayoutButtonProps) {
  if (!onAutoLayout) return null;

  /** Базовые классы кнопки тулбара */
  const buttonBaseClasses =
    'flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';

  /** Классы неактивной кнопки */
  const inactiveClasses =
    'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';

  return (
    <button
      onClick={onAutoLayout}
      className={`${buttonBaseClasses} ${inactiveClasses}`}
      title="Авто-расстановка узлов (Shift+A)"
    >
      <i className="fas fa-sitemap text-slate-600 dark:text-slate-400 text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
    </button>
  );
}
