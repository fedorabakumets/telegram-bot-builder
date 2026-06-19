/**
 * @fileoverview Кнопка-переключатель видимости порталов в тулбаре
 * @module canvas/portals-toggle-button
 */

/**
 * Свойства кнопки переключения порталов
 */
interface PortalsToggleButtonProps {
  /** Активны ли порталы */
  active: boolean;
  /** Колбэк переключения видимости */
  onToggle: () => void;
  /** Количество порталов (для отображения бейджа) */
  count?: number;
}

/**
 * Кнопка-переключатель отображения порталов к другим листам.
 * В активном состоянии подсвечивается фиолетовым цветом.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки
 */
export function PortalsToggleButton({ active, onToggle, count }: PortalsToggleButtonProps) {
  /** Базовые классы кнопки (совпадают со стилем соседних кнопок тулбара) */
  const buttonBaseClasses = 'relative flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';

  /** Классы для неактивного состояния */
  const inactiveClasses = 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';

  /** Классы для активного состояния (подсветка purple) */
  const activeClasses = 'bg-purple-500/90 hover:bg-purple-500 border-purple-400 dark:border-purple-500';

  /** Классы иконки в зависимости от состояния */
  const iconClasses = active
    ? 'text-white text-sm'
    : 'text-slate-600 dark:text-slate-400 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors';

  return (
    <button
      onClick={onToggle}
      className={`${buttonBaseClasses} ${active ? activeClasses : inactiveClasses}`}
      title="Показать порталы к другим листам"
    >
      <i className={`fas fa-external-link-alt ${iconClasses}`} />
      {/* Бейдж с количеством порталов */}
      {count != null && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {count}
        </span>
      )}
    </button>
  );
}
