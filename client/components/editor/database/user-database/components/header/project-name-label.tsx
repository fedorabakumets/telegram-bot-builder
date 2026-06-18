/**
 * @fileoverview Метки проекта: имя и ID для списков и селекторов
 * @module components/editor/database/user-database/components/header/project-name-label
 */

import { cn } from '@/utils/utils';

/** Пропсы бейджа числового ID */
interface IdBadgeProps {
  /** Числовой идентификатор */
  id: number;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Компактный бейдж с числовым ID (#42)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function IdBadge({ id, className }: IdBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border border-border/50',
        'bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono font-medium leading-none',
        'tabular-nums text-muted-foreground',
        className,
      )}
    >
      #{id}
    </span>
  );
}

/** @deprecated Используй IdBadge */
export const ProjectIdBadge = IdBadge;

/** Пропсы строки «имя + ID» */
interface ProjectOptionLabelProps {
  /** Отображаемое имя проекта */
  name: string;
  /** Числовой ID проекта */
  id: number;
  /**
   * compact — одна строка для Select;
   * detail — строка с метриками справа (Worker Pool)
   */
  layout?: 'compact' | 'detail';
  /** Дополнительный контент справа (только для layout="detail") */
  trailing?: React.ReactNode;
  /** Дополнительные CSS-классы корневого элемента */
  className?: string;
}

/**
 * Строка списка: имя проекта и бейдж #id
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectOptionLabel({
  name,
  id,
  layout = 'compact',
  trailing,
  className,
}: ProjectOptionLabelProps) {
  if (layout === 'detail') {
    return (
      <div className={cn('flex items-center justify-between gap-3', className)}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs leading-snug" title={name}>
            {name}
          </span>
          <IdBadge id={id} />
        </div>
        {trailing}
      </div>
    );
  }

  return (
    <span className={cn('flex w-full min-w-0 items-center justify-between gap-3', className)}>
      <span className="truncate text-xs">{name}</span>
      <IdBadge id={id} />
    </span>
  );
}
