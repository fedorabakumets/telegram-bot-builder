/**
 * @fileoverview Дополнительные команды панели холста
 */

import type { ReactNode } from 'react';
import { Ellipsis } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Открывает список дополнительных команд холста.
 * @param props - Содержимое меню
 * @returns Кнопка и всплывающая панель
 */
export function CanvasToolbarMore({ children, learnTargets }: {
  /** Группы команд. */
  children: ReactNode;
  /** Шаги обучения для команд, скрытых в меню на узкой панели. */
  learnTargets: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Действия холста" title="Действия холста"
          data-learn-toolbar={learnTargets}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 hover:bg-muted">
          <Ellipsis className="size-4" aria-hidden="true" />
          <span className="hidden @[360px]:inline">Действия холста</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Дополнительные команды холста"
        data-block-canvas-shortcuts
        className="w-[min(20rem,calc(100vw-1rem))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-2">
        <div className="divide-y divide-border">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Показывает назначение набора кнопок в меню холста.
 * @param props - Подпись и кнопки группы
 * @returns Строка меню
 */
export function CanvasToolbarMoreRow({ label, children }: {
  /** Название группы */
  label: string;
  /** Кнопки группы */
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex min-h-10 flex-wrap items-center justify-between gap-x-2 px-2 py-1">
      <span className="text-sm">{label}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}
