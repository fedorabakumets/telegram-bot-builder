/**
 * @fileoverview Компонент кнопок отмены и повтора действий
 * 
 * Содержит кнопки Undo/Redo для управления историей действий
 * в компоненте Canvas.
 */

/**
 * Свойства компонента кнопок отмены/повтора
 */
interface UndoRedoButtonsProps {
  /** Доступность отмены действия */
  canUndo: boolean;
  /** Доступность повтора действия */
  canRedo?: boolean;
  /** Колбэк отмены действия */
  onUndo?: () => void;
  /** Колбэк повтора действия */
  onRedo?: () => void;
}

/**
 * Базовые классы для кнопок
 */
const BUTTON_BASE_CLASSES = 'flex-shrink-0 p-0 h-9 w-9 rounded-xl border transition-colors duration-200 group flex items-center justify-center';
const BUTTON_INACTIVE_CLASSES = 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70';
const BUTTON_DISABLED_CLASSES = 'opacity-50 cursor-not-allowed disabled:hover:bg-slate-200/60 disabled:dark:hover:bg-slate-700/50';

/**
 * Компонент кнопок отмены и повтора действий
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками Undo/Redo
 */
export function UndoRedoButtons({ canUndo, canRedo = false, onUndo, onRedo }: UndoRedoButtonsProps) {
  return (
    <>
      {/* Кнопка отмены действия */}
      <button
        onClick={() => { if (canUndo) onUndo?.(); }}
        disabled={!canUndo}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES} ${!canUndo ? BUTTON_DISABLED_CLASSES : ''}`}
        title="Отменить действие (Ctrl + Z)"
      >
        <i className={`fas fa-undo text-sm transition-colors ${canUndo ? 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </button>

      {/* Кнопка повтора действия */}
      <button
        onClick={() => { if (canRedo) onRedo?.(); }}
        disabled={!canRedo}
        className={`${BUTTON_BASE_CLASSES} ${BUTTON_INACTIVE_CLASSES} ${!canRedo ? BUTTON_DISABLED_CLASSES : ''}`}
        title="Повторить действие (Ctrl + Y)"
      >
        <i className={`fas fa-redo text-sm transition-colors ${canRedo ? 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </button>
    </>
  );
}
