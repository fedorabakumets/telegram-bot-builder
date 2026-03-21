import { cn } from "@/utils/utils";

/**
 * @fileoverview Компонент кнопок действий узла (копирование/удаление)
 *
 * Отображает кнопки копирования и удаления узла.
 * Кнопки скрыты по умолчанию и появляются при наведении на узел
 * (через класс `group` на wrapper-div) или когда узел выбран (`isSelected`).
 */

/**
 * Интерфейс свойств компонента NodeActions
 *
 * @interface NodeActionsProps
 * @property {() => void} [onDuplicate] - Обработчик дублирования
 * @property {() => void} [onDelete] - Обработчик удаления
 * @property {boolean} [isSelected] - Флаг выбранного состояния узла; при `true` кнопки всегда видимы
 */
interface NodeActionsProps {
  /** Обработчик дублирования с опциональной целевой позицией */
  onDuplicate?: (targetPosition?: { x: number; y: number }) => void;
  /** Обработчик удаления */
  onDelete?: () => void;
  /** Флаг выбранного состояния узла; при `true` кнопки всегда видимы */
  isSelected?: boolean;
}

/**
 * Компонент кнопок действий узла
 *
 * @component
 * @description Отображает кнопки копирования и удаления.
 * Кнопки скрыты по умолчанию (`opacity-0`) и становятся видимыми:
 * - при наведении на узел (`group-hover:opacity-100`);
 * - когда узел выбран (`isSelected === true`).
 *
 * @param {NodeActionsProps} props - Свойства компонента
 * @param {() => void} [props.onDuplicate] - Обработчик дублирования
 * @param {() => void} [props.onDelete] - Обработчик удаления
 * @param {boolean} [props.isSelected] - Флаг выбранного состояния узла
 *
 * @returns {JSX.Element} Компонент кнопок действий
 */
export function NodeActions({ onDuplicate, onDelete, isSelected }: NodeActionsProps) {
  return (
    <>
      {onDuplicate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            isSelected && "opacity-100",
            "absolute -top-2 -left-2 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-300 focus:bg-gradient-to-br focus:from-blue-100 focus:to-indigo-100 dark:focus:from-blue-800/50 dark:focus:to-indigo-800/50 transition-shadow duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-400 dark:focus:border-blue-500 z-50"
          )}
          title="Копировать элемент"
        >
          <i className="fas fa-copy text-xs transition-transform duration-200"></i>
        </button>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            isSelected && "opacity-100",
            "absolute -top-2 -right-2 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 hover:text-red-700 dark:hover:text-red-300 focus:bg-gradient-to-br focus:from-red-100 focus:to-rose-100 dark:focus:from-red-800/50 dark:focus:to-rose-800/50 transition-shadow duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl border border-red-200/50 dark:border-red-700/50 hover:border-red-300 dark:hover:border-red-600 focus:border-red-400 dark:focus:border-red-500 z-50"
          )}
          title="Удалить элемент"
        >
          <i className="fas fa-times text-xs transition-transform duration-200"></i>
        </button>
      )}
    </>
  );
}
