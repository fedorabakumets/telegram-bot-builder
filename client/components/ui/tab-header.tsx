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
 * Универсальный заголовок вкладки.
 * Мобильный: строка 1 — заголовок + actions, строка 2 — children.
 * Десктоп: одна строка в широкой панели; в узкой (split/resizable) — две строки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка вкладки
 */
export function TabHeader({ icon, title, children, actions, className }: TabHeaderProps) {
  const titleBlock = (
    <div className="flex items-center gap-2.5 shrink-0 min-w-0">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">{icon}</div>
      <h2 className="text-base font-semibold leading-none shrink-0">{title}</h2>
    </div>
  );

  const actionsBlock = actions ? (
    <div className="flex items-center gap-2 shrink-0">{actions}</div>
  ) : null;

  const childrenBlock = children ? (
    <div className="flex flex-wrap items-center gap-2 min-w-0 w-full @[720px]:w-auto @[720px]:flex-1">
      {children}
    </div>
  ) : null;

  return (
    <div
      className={cn(
        '@container px-4 sm:px-6 py-2.5 sm:py-3 border-b bg-gradient-to-r from-muted/40 to-background',
        className,
      )}
    >
      {/* Десктоп: узкая панель — заголовок и actions сверху, children снизу */}
      <div className="hidden sm:flex @[720px]:hidden flex-col gap-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {titleBlock}
          {actionsBlock}
        </div>
        {childrenBlock}
      </div>

      {/* Десктоп: широкая панель — одна строка с переносом при нехватке места */}
      <div className="hidden @[720px]:flex flex-wrap items-center gap-2">
        {titleBlock}
        {children}
        {actionsBlock && <div className="ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Мобильный: 2 строки */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
              {icon}
            </div>
            <h2 className="text-sm font-semibold leading-none shrink-0">
              {title}
            </h2>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
