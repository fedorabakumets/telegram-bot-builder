/**
 * @fileoverview Заголовок категории/подкатегории палитры
 * @module components/editor/sidebar/components/palette-category-header
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';

/** Пропсы заголовка */
export interface PaletteCategoryHeaderProps {
  /** Текст заголовка */
  title: string;
  /** Пояснение группы (переносится на узкой панели) */
  description?: string;
  /** Число элементов */
  count: number;
  /** Свёрнута ли секция */
  collapsed: boolean;
  /** Клик по заголовку */
  onToggle: () => void;
  /** Вариант оформления */
  variant?: 'main' | 'sub';
  /** Иконка FontAwesome для главной категории */
  icon?: string;
  /** data-testid */
  testId?: string;
}

/**
 * Кнопка-заголовок секции палитры
 * @param props - Свойства
 * @returns JSX элемент
 */
export function PaletteCategoryHeader({
  title,
  description,
  count,
  collapsed,
  onToggle,
  variant = 'sub',
  icon,
  testId,
}: PaletteCategoryHeaderProps) {
  const isMain = variant === 'main';
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-start justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5',
        'rounded-lg sm:rounded-xl transition-all duration-200 group relative text-left',
        'border hover:border-primary/30',
        isMain
          ? 'bg-slate-200/90 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 border-slate-300/50 dark:border-slate-600/50'
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/40 dark:border-slate-700/40 ml-1',
      )}
      data-testid={testId}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {icon && (
          <i
            className={cn(
              icon,
              'text-sm flex-shrink-0 mt-0.5',
              isMain ? 'text-primary' : 'text-muted-foreground',
            )}
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold break-words', isMain ? 'text-sm' : 'text-xs sm:text-sm')}>
              {title}
            </span>
            <span className="text-xs normal-case bg-muted/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-full font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              {count}
            </span>
          </div>
          {description ? (
            <p className="text-[11px] sm:text-xs font-normal text-muted-foreground leading-snug break-words whitespace-normal">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex-shrink-0 p-1 rounded-md group-hover:bg-muted/50 transition-colors mt-0.5">
        {collapsed ? (
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>
    </button>
  );
}
