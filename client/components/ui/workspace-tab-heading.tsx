/**
 * @fileoverview Единый заголовок рабочих вкладок с иконкой, описанием и действиями.
 */
import type { ReactNode } from 'react';

/** Свойства заголовка рабочей вкладки. */
interface WorkspaceTabHeadingProps {
  /** Короткое название раздела. */
  title: string;
  /** Описание назначения или следующего шага. */
  description: string;
  /** Иконка раздела из основной навигации. */
  icon: ReactNode;
  /** Дополнительные действия справа от заголовка. */
  actions?: ReactNode;
}

/**
 * Показывает одинаковую иерархию текста и отступы в рабочих вкладках.
 * @param props - Название, описание, иконка и действия раздела.
 * @returns Заголовок вкладки с названием 20 пикселей и описанием 16 пикселей.
 */
export function WorkspaceTabHeading({ title, description, icon, actions }: WorkspaceTabHeadingProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="shrink-0 text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
          <h2 className="text-balance text-xl font-semibold">{title}</h2>
        </div>
        <p className="max-w-2xl text-pretty text-base text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
