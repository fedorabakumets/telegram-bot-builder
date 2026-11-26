/**
 * @fileoverview Переключатель режима панели свойств: Настройки / JSON
 * @module components/editor/properties/components/layout/properties-view-toggle
 */

import { useEditorAppearance } from '@/components/editor/shared/use-editor-appearance';
import { Braces, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/utils';

/** Режим отображения панели свойств */
export type PropertiesView = 'form' | 'json';

/** Свойства компонента PropertiesViewToggle */
interface PropertiesViewToggleProps {
  /** Текущий активный режим */
  value: PropertiesView;
  /** Обработчик смены режима */
  onChange: (view: PropertiesView) => void;
}

/**
 * Segmented-control переключатель между формой настроек и JSON node.data
 * @param props - Свойства компонента
 * @returns JSX элемент переключателя
 */
export function PropertiesViewToggle({ value, onChange }: PropertiesViewToggleProps) {
  const activeStyle = useEditorAppearance('underlineTabs') ? 'text-foreground [&>span]:border-b-2 [&>span]:border-current' : 'bg-blue-600 text-white';
  return (
    <div className="grid grid-cols-2 h-7 w-full gap-1">
      <button
        type="button"
        aria-pressed={value === 'form'} onClick={() => onChange('form')}
        className={cn(
          'flex items-center justify-center gap-1.5 h-full min-w-0 px-2 text-xs rounded-sm transition-all',
          value === 'form'
            ? activeStyle
            : 'text-muted-foreground hover:text-foreground',
        )}
        data-testid="properties-view-form"
      >
        <SlidersHorizontal className="h-3 w-3 shrink-0" />
        <span className="truncate border-b-2 border-transparent">Настройки</span>
      </button>
      <button
        type="button"
        aria-pressed={value === 'json'} onClick={() => onChange('json')}
        className={cn(
          'flex items-center justify-center gap-1.5 h-full min-w-0 px-2 text-xs rounded-sm transition-all',
          value === 'json'
            ? activeStyle
            : 'text-muted-foreground hover:text-foreground',
        )}
        data-testid="properties-view-json"
      >
        <Braces className="h-3 w-3 shrink-0" />
        <span className="truncate border-b-2 border-transparent">JSON</span>
      </button>
    </div>
  );
}
