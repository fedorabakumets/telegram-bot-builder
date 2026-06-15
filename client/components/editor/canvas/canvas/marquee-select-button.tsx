/**
 * @fileoverview Кнопка-переключатель инструмента рамочного выделения в тулбаре
 * @module canvas/marquee-select-button
 */

/**
 * Свойства кнопки рамочного выделения
 */
interface MarqueeSelectButtonProps {
  /** Активен ли инструмент рамки */
  active: boolean;
  /** Колбэк переключения инструмента */
  onToggle: () => void;
}

/**
 * Кнопка-переключатель инструмента рамочного выделения узлов.
 * В активном состоянии подсвечивается цветом indigo.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function MarqueeSelectButton({ active, onToggle }: MarqueeSelectButtonProps) {
  /** Базовые классы кнопки (совпадают со стилем соседних кнопок тулбара) */
  const buttonBaseClasses = 'flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';

  /** Классы для неактивного состояния */
  const inactiveClasses = 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';

  /** Классы для активного состояния (подсветка indigo) */
  const activeClasses = 'bg-indigo-500/90 hover:bg-indigo-500 border-indigo-400 dark:border-indigo-500';

  /** Классы иконки в зависимости от состояния */
  const iconClasses = active
    ? 'text-white text-sm'
    : 'text-slate-600 dark:text-slate-400 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors';

  return (
    <button
      onClick={onToggle}
      className={`${buttonBaseClasses} ${active ? activeClasses : inactiveClasses}`}
      title="Рамочное выделение нескольких узлов (M)"
    >
      <i className={`fas fa-object-group ${iconClasses}`} />
    </button>
  );
}
