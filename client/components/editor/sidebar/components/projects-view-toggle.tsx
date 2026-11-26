/**
 * @fileoverview Переключатель «Активные | Архив» для вкладки проектов
 * @module components/editor/sidebar/components/projects-view-toggle
 */

/** Режим отображения списка проектов */
export type ProjectsViewMode = 'active' | 'archived';

/**
 * Пропсы переключателя активные/архив
 */
export interface ProjectsViewToggleProps {
  /** Текущий режим */
  value: ProjectsViewMode;
  /** Обработчик смены режима */
  onChange: (value: ProjectsViewMode) => void;
}

/**
 * Переключатель между активными и архивными проектами
 * @param props - Свойства компонента
 * @returns JSX элемент переключателя
 */
export function ProjectsViewToggle({ value, onChange }: ProjectsViewToggleProps) {
  return (
    <div className="flex space-x-1 bg-gradient-to-r from-zinc-200/40 to-zinc-100/20 dark:from-zinc-800/40 dark:to-zinc-700/20 rounded-lg p-1 backdrop-blur-sm border border-zinc-300/20 dark:border-zinc-600/20">
      <button
        type="button"
        onClick={() => onChange('active')}
        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
          value === 'active'
            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-zinc-700/30'
        }`}
      >
        Активные
      </button>
      <button
        type="button"
        onClick={() => onChange('archived')}
        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
          value === 'archived'
            ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-zinc-700/30'
        }`}
      >
        Архив
      </button>
    </div>
  );
}
