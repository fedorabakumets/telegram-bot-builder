/**
 * @fileoverview Переключатель «Активные | Архив» для вкладки проектов
 * @module components/editor/sidebar/components/projects-view-toggle
 */

import { useEditorAppearance } from '../../shared/use-editor-appearance';

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
  const activeStyle = useEditorAppearance('underlineTabs')
    ? 'text-foreground underline decoration-2 underline-offset-4'
    : 'bg-blue-600 text-white';

  return (
    <div role="group" aria-label="Фильтр проектов" className="flex gap-1">
      {(['active', 'archived'] as const).map(mode => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`min-w-0 flex-1 rounded px-1 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring ${value === mode ? activeStyle : 'text-muted-foreground hover:text-foreground'}`}
        >
          {mode === 'active' ? 'Активные' : 'Архив'}
        </button>
      ))}
    </div>
  );
}
