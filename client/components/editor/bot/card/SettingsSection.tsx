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
}

/**
 * Заголовок и один список с разделителями (как у Railway Settings)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      <h3 className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card divide-y divide-border/50">
        {children}
      </div>
    </section>
  );
}
