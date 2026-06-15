/**
 * @fileoverview Плавающий бар групповых действий над выделенными узлами
 * @module canvas/multi-selection-toolbar
 */

import { MultiSelectionSheetMenu } from './multi-selection-sheet-menu';
import { MultiSelectionProjectMenu } from './multi-selection-project-menu';

/**
 * Свойства плавающего бара групповых действий
 */
interface MultiSelectionToolbarProps {
  /** Количество выделенных узлов */
  count: number;
  /** Список листов проекта (без активного) */
  sheets: Array<{ id: string; name: string }>;
  /** Список других проектов (без текущего) */
  projects: Array<{ id: number; name: string; ownerId: number | null }>;
  /** Колбэк удаления всех выделенных узлов */
  onDelete: () => void;
  /** Колбэк копирования выделенных узлов в буфер */
  onCopy: () => void;
  /** Колбэк перемещения в существующий лист */
  onMoveToSheet: (sheetId: string) => void;
  /** Колбэк перемещения в новый лист */
  onMoveToNewSheet: () => void;
  /** Колбэк переноса выделенных узлов в другой проект */
  onMoveToProject: (targetProjectId: number) => void;
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
  projects,
  onDelete,
  onCopy,
  onMoveToSheet,
  onMoveToNewSheet,
  onMoveToProject,
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

      {/* В проект ▾ — перенос выделенных узлов в новый лист другого проекта */}
      <MultiSelectionProjectMenu
        projects={projects}
        onMoveToProject={onMoveToProject}
      />
    </div>
  );
}
