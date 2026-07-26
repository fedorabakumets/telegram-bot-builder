/**
 * @fileoverview Строка настройки внутри секции (без собственной рамки)
 * @module bot/card/SettingCard
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';

/** Пропсы строки настройки */
export interface SettingCardProps {
  /** Иконка настройки */
  icon: LucideIcon;
  /** Заголовок */
  title: string;
  /** Пояснение под заголовком */
  description?: ReactNode;
  /** Правый слот (обычно Switch) */
  action?: ReactNode;
  /** Нижний слот (Select, поля, спойлер) */
  children?: ReactNode;
  /** Настройка включена — лёгкая подсветка иконки */
  active?: boolean;
  /** Настройка недоступна */
  disabled?: boolean;
  /** Дополнительные классы */
  className?: string;
  /** Значение data-testid контейнера */
  testId?: string;
}

/**
 * Строка настройки: иконка, заголовок, описание, слоты
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SettingCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  active = false,
  disabled = false,
  className,
  testId,
}: SettingCardProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col gap-2.5 px-3.5 py-3',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            active ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
          {description && (
            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </div>
      {children && <div className="pl-10">{children}</div>}
    </div>
  );
}
