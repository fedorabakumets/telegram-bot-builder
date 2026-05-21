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
 * Универсальный заголовок вкладки: иконка + заголовок + контент + действия в одной строке.
 * На узких экранах элементы переносятся через flex-wrap.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка вкладки
 */
export function TabHeader({ icon, title, children, actions, className }: TabHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1.5 px-4 sm:px-6 py-2.5 sm:py-3 border-b bg-gradient-to-r from-muted/40 to-background",
        className,
      )}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2 shrink-0">
          {icon}
        </div>
        <h2 className="text-sm sm:text-base font-semibold leading-none shrink-0">
          {title}
        </h2>
      </div>

      {children}

      {actions && (
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
