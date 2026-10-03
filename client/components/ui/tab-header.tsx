/**
 * @fileoverview Переиспользуемый заголовок вкладки с иконкой, заголовком, слотами для контента и действий
 * @module client/components/ui/tab-header
 */

import { cn } from "@/utils/utils";

/** Пропсы компонента TabHeader */
export interface TabHeaderProps {
  /** Иконка вкладки (lucide компонент) */
  icon: React.ReactNode;
  /** Заголовок вкладки */
  title: string;
  /** Элементы сразу после заголовка на 1-й строке (селектор проекта и т.п.) */
  leading?: React.ReactNode;
  /** Элементы между заголовком и действиями (селекторы, бейджи) */
  children?: React.ReactNode;
  /** Кнопки действий справа */
  actions?: React.ReactNode;
  /** Дополнительные CSS классы */
  className?: string;
  /** На десктопе всегда держать содержимое в одной строке */
  singleLine?: boolean;
}

/**
 * Универсальный заголовок вкладки.
 * Узкая панель: строка 1 — заголовок и действия, строка 2 — фильтры.
 * Широкая панель (или singleLine на десктопе): всё в одну строку.
 * Одна строка ровно 56px (min-h-14), как шапка сайдбара, чтобы границы совпали.
 * Разметка одна, без второй копии шапки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка вкладки
 */
export function TabHeader({
  icon,
  title,
  leading,
  children,
  actions,
  className,
  singleLine = false,
}: TabHeaderProps) {
  /** С этого порога шапка становится одной строкой */
  const row = singleLine
    ? 'sm:flex sm:flex-wrap sm:items-center'
    : '@[720px]:flex @[720px]:flex-wrap @[720px]:items-center';
  /** Фильтры на узкой панели занимают вторую строку целиком */
  const filters = singleLine
    ? 'sm:col-auto sm:row-auto sm:flex-1'
    : '@[720px]:col-auto @[720px]:row-auto @[720px]:flex-1';
  /** Кнопки на широкой панели уезжают в конец строки */
  const tools = singleLine
    ? 'sm:col-auto sm:row-auto sm:ml-auto'
    : '@[720px]:col-auto @[720px]:row-auto @[720px]:ml-auto';

  return (
    <div
      className={cn(
        '@container flex min-h-14 items-center border-b border-border/50 px-4 sm:px-6 py-1.5',
        'bg-gradient-to-r from-muted/40 to-background',
        className,
      )}
    >
      <div className={cn('grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2', row)}>
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="shrink-0 rounded-lg bg-primary/10 p-2">{icon}</div>
            <h2 className="shrink-0 text-base font-semibold leading-none">{title}</h2>
          </div>
          {leading ? (
            <div className="flex min-w-0 shrink items-center gap-1.5">{leading}</div>
          ) : null}
        </div>

        {children ? (
          <div className={cn('col-span-2 col-start-1 row-start-2 flex min-w-0 flex-wrap items-center gap-2', filters)}>
            {children}
          </div>
        ) : null}

        {actions ? (
          <div className={cn('col-start-2 row-start-1 flex shrink-0 items-center gap-2', tools)}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
