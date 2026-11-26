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
 * Карточка узла с перетаскиванием и видимой кнопкой добавления на холст
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
        'component-item group/item [container-type:inline-size] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 pl-1.5 pr-2 py-1.5',
        'bg-white dark:bg-zinc-950',
        'hover:bg-zinc-100 dark:hover:bg-zinc-900',
        'relative rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select',
        'border border-border/30 hover:border-zinc-500',
        isTouchDragging ? 'opacity-50 scale-95' : '',
      )}
      data-testid={`component-${component.id}`}
    >
      {/** Вся площадка иконки доступна как одно именованное изображение. */}
      <div data-palette-icon-color role="img" aria-label={`Иконка: ${component.name}`} data-testid={`component-icon-${component.id}`}
        className={cn(
          '[@container(max-width:12rem)]:hidden w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
          'transition-transform group-hover/item:scale-110',
          component.color,
        )}
      >
        <i aria-hidden="true" className={`${component.icon} pointer-events-none text-xs sm:text-sm`} />
      </div>
      <div className="min-w-0 col-start-2 [@container(max-width:12rem)]:col-span-full">
        <p className="text-xs sm:text-sm font-semibold text-foreground break-normal whitespace-normal overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {component.name}
        </p>
        {component.description ? (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground break-normal whitespace-normal overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
            {component.description}
          </p>
        ) : null}
      </div>
      {onComponentAdd && (
        <button
          type="button"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComponentAdd(component);
          }}
          className={cn(
            'justify-self-end [@container(max-width:12rem)]:col-span-full w-7 h-7 sm:w-8 sm:h-8 rounded-lg',
            'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
            'dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
            'flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-current',
            'transition-opacity duration-200 ',
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
