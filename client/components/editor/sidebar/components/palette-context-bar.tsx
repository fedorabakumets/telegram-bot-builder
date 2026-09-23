/**
 * @fileoverview Липкая полоска контекста палитры: «главная › подкатегория»
 * Клик по названию сворачивает/разворачивает секцию; на узкой панели — перенос
 * @module components/editor/sidebar/components/palette-context-bar
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { PaletteScrollContext } from './use-palette-scroll-context';

/** Пропсы полоски контекста */
export interface PaletteContextBarProps {
  /** Текущий контекст прокрутки */
  context: PaletteScrollContext | null;
  /** Главная секция свёрнута */
  mainCollapsed?: boolean;
  /** Подкатегория свёрнута */
  subCollapsed?: boolean;
  /** Клик по названию главной категории */
  onToggleMain?: () => void;
  /** Клик по названию подкатегории */
  onToggleSub?: () => void;
}

/**
 * Липкая строка; на узкой панели крошки переносятся, без обрезки «…»
 * @param props - Свойства
 * @returns JSX элемент или null
 */
export function PaletteContextBar({
  context,
  mainCollapsed,
  subCollapsed,
  onToggleMain,
  onToggleSub,
}: PaletteContextBarProps) {
  if (!context?.visible || !context.main) return null;

  return (
    <div
      className={cn(
        'sticky top-0 z-20 -mx-2 px-2 py-1.5 mb-1',
        'bg-background/95 backdrop-blur-sm border-b border-border/60',
      )}
      data-testid="palette-context-bar"
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 py-1 rounded-lg w-full min-w-0',
          'bg-slate-200/90 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-600/40',
          'text-xs sm:text-sm shadow-sm',
        )}
      >
        {context.icon ? (
          <i className={cn(context.icon, 'text-muted-foreground flex-shrink-0 text-sm')} />
        ) : null}

        <button
          type="button"
          onClick={onToggleMain}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md max-w-full',
            'font-semibold text-foreground hover:bg-slate-300/70 dark:hover:bg-slate-700',
            'transition-colors text-left',
          )}
          title={mainCollapsed ? `Развернуть «${context.main}»` : `Свернуть «${context.main}»`}
          data-testid="palette-context-main"
        >
          {mainCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          )}
          <span className="whitespace-normal break-words">{context.main}</span>
        </button>

        {context.sub ? (
          <button
            type="button"
            onClick={onToggleSub}
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md max-w-full',
              'font-medium text-muted-foreground hover:text-foreground',
              'hover:bg-slate-300/70 dark:hover:bg-slate-700',
              'transition-colors text-left',
            )}
            title={subCollapsed ? `Развернуть «${context.sub}»` : `Свернуть «${context.sub}»`}
            data-testid="palette-context-sub"
          >
            <span className="text-muted-foreground font-normal flex-shrink-0">›</span>
            {subCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="whitespace-normal break-words">{context.sub}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
