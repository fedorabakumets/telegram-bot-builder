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
      aria-expanded={!collapsed}
      onClick={onToggle}
      className={cn(
        'w-full [container-type:inline-size] grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1 gap-y-0.5 px-2 py-1.5',
        'rounded-lg sm:rounded-xl transition-all duration-200 group relative text-left',
        'border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 focus-visible:outline-zinc-500',
        isMain
          ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800'
          : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900',
      )}
      data-testid={testId}
    >
      {/** В узкой карточке название получает всю строку, счётчик и стрелка располагаются ниже. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 [@container(max-width:9rem)]:contents">
        {icon && (
          <i
            className={cn(
              icon,
              'text-sm flex-shrink-0 mt-0.5 [@container(max-width:9rem)]:hidden',
              'text-muted-foreground',
            )}
          />
        )}


            <span className={cn('min-w-0 font-semibold [@container(max-width:9rem)]:col-span-full [@container(max-width:9rem)]:row-start-1 [overflow-wrap:anywhere]', isMain ? 'text-sm' : 'text-xs sm:text-sm')}>
              {title}
            </span>
            <span className="justify-self-start text-xs normal-case bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0 group-hover:text-foreground transition-colors">
              {count}
            </span>
      </div>
      <div className="flex-shrink-0 rounded-md group-hover:bg-muted/50 transition-colors mt-0.5">
        {collapsed ? (
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>
      {/** Описание занимает всю ширину карточки, включая пространство под иконками. */}
      {description && (
        <span className="col-span-full text-xs font-normal leading-snug text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}
