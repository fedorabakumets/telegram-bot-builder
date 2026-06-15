/**
 * @fileoverview Плавающий бар групповых действий над выделенными узлами
 * @module canvas/multi-selection-toolbar
 */

import { MultiSelectionSheetMenu } from './multi-selection-sheet-menu';

/**
 * Свойства плавающего бара групповых действий
 */
interface MultiSelectionToolbarProps {
  /** Количество выделенных узлов */
  count: number;
  /** Список листов проекта (без активного) */
  sheets: Array<{ id: string; name: string }>;
  /** Колбэк удаления всех выделенных узлов */
  onDelete: () => void;
  /** Колбэк копирования выделенных узлов в буфер */
  onCopy: () => void;
  /** Колбэк перемещения в существующий лист */
  onMoveToSheet: (sheetId: string) => void;
  /** Колбэк перемещения в новый лист */
  onMoveToNewSheet: () => void;
}

/**
 * Плавающий бар групповых действий. Показывается когда выделено более одного узла.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент бара групповых действий
 */
export function MultiSelectionToolbar({
  count,
  sheets,
  onDelete,
  onCopy,
  onMoveToSheet,
  onMoveToNewSheet,
}: MultiSelectionToolbarProps) {
  if (count <= 1) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-40 flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/70 dark:border-slate-600/70 shadow-xl pointer-events-auto">
      {/* Счётчик выделенных узлов */}
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 px-2">
        {count} узлов
      </span>

      <div className="h-5 w-px bg-slate-300/60 dark:bg-slate-600/60" />

      {/* Удалить */}
      <button
        onClick={onDelete}
        className="h-8 px-3 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5"
        title="Удалить выделенные узлы (Delete)"
      >
        <i className="fas fa-trash text-xs" />
        Удалить
      </button>

      {/* Копировать */}
      <button
        onClick={onCopy}
        className="h-8 px-3 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        title="Копировать выделенные узлы в буфер (Ctrl+Shift+C)"
      >
        <i className="fas fa-clipboard text-xs" />
        Копировать
      </button>

      {/* В лист ▾ */}
      <MultiSelectionSheetMenu
        sheets={sheets}
        onMoveToSheet={onMoveToSheet}
        onMoveToNewSheet={onMoveToNewSheet}
      />

      {/* В проект ▾ — заглушка: межпроектный перенос пока через буфер обмена */}
      {/* TODO: реализовать dropdown со списком проектов и прямым переносом */}
      <button
        disabled
        className="h-8 px-3 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed flex items-center gap-1.5"
        title="Перенос в другой проект скоро — пока используйте Копировать и вставьте в другом проекте"
      >
        <i className="fas fa-diagram-project text-xs" />
        В проект
        <i className="fas fa-caret-down text-[10px]" />
      </button>
    </div>
  );
}
