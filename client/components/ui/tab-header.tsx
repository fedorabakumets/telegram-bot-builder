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
  /** Элементы между заголовком и действиями (селекторы, бейджи) */
  children?: React.ReactNode;
  /** Кнопки действий справа */
  actions?: React.ReactNode;
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Универсальный заголовок вкладки: иконка + заголовок + действия в первой строке,
 * слот контента (селекторы, бейджи) во второй строке при переносе.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка вкладки
 */
export function TabHeader({ icon, title, children, actions, className }: TabHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-muted/40 to-background space-y-1.5",
        className,
      )}
    >
      {/* Строка 1: иконка + заголовок + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2 shrink-0">
            {icon}
          </div>
          <h2 className="text-sm sm:text-base font-semibold leading-none shrink-0">
            {title}
          </h2>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Строка 2: children (селекторы, бейджи) — только если есть */}
      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
