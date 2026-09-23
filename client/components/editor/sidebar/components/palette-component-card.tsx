/**
 * @fileoverview Карточка компонента в палитре сайдбара
 * @module components/editor/sidebar/components/palette-component-card
 */

import { ComponentDefinition } from '@shared/schema';
import { cn } from '@/utils/utils';
import { Plus } from 'lucide-react';

/** Пропсы карточки компонента */
export interface PaletteComponentCardProps {
  /** Компонент */
  component: ComponentDefinition;
  /** Подсветка touch-drag */
  isTouchDragging?: boolean;
  /** Начало drag */
  onDragStart: (e: React.DragEvent, component: ComponentDefinition) => void;
  /** Touch start */
  onTouchStart: (e: React.TouchEvent, component: ComponentDefinition) => void;
  /** Touch move */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Touch end */
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Добавить на холст */
  onComponentAdd?: (component: ComponentDefinition) => void;
}

/**
 * Карточка ноды в палитре
 * @param props - Свойства
 * @returns JSX элемент
 */
export function PaletteComponentCard({
  component,
  isTouchDragging,
  onDragStart,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onComponentAdd,
}: PaletteComponentCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, component)}
      onTouchStart={(e) => onTouchStart(e, component)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        'component-item group/item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3',
        'bg-gradient-to-br from-muted/40 to-muted/20 dark:from-slate-800/50 dark:to-slate-900/30',
        'hover:from-muted/70 hover:to-muted/40 dark:hover:from-slate-700/60 dark:hover:to-slate-800/40',
        'rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select',
        'border border-border/30 hover:border-primary/30',
        isTouchDragging ? 'opacity-50 scale-95' : '',
      )}
      data-testid={`component-${component.id}`}
    >
      <div
        className={cn(
          'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          'transition-transform group-hover/item:scale-110',
          component.color,
        )}
      >
        <i className={`${component.icon} text-xs sm:text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground break-words whitespace-normal">
          {component.name}
        </p>
        {component.description ? (
          <p className="text-xs text-muted-foreground leading-snug break-words whitespace-normal mt-0.5">
            {component.description}
          </p>
        ) : null}
      </div>
      {onComponentAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComponentAdd(component);
          }}
          className={cn(
            'ml-1 flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg',
            'bg-primary/10 hover:bg-primary/20 text-primary',
            'dark:bg-primary/15 dark:hover:bg-primary/25',
            'hidden group-hover/item:flex items-center justify-center',
            'transition-all duration-200 hover:shadow-md hover:shadow-primary/20',
          )}
          title={`Добавить ${component.name} на холст`}
          data-testid={`button-add-${component.id}`}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      )}
    </div>
  );
}
