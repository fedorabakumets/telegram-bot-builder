/**
 * @fileoverview Секция настроек: заголовок + единый контейнер со строками
 * @module bot/card/SettingsSection
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';

/** Пропсы секции настроек */
interface SettingsSectionProps {
  /** Заголовок секции */
  title: string;
  /** Строки / блоки секции */
  children: ReactNode;
  /** Дополнительные классы обёртки */
  className?: string;
  /** Счётчик справа от заголовка */
  count?: number;
}

/**
 * Заголовок и один список с разделителями (как у Railway Settings)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SettingsSection({ title, children, className, count }: SettingsSectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {typeof count === 'number' && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/60 bg-card">
        {children}
      </div>
    </section>
  );
}
