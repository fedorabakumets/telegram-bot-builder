/** @fileoverview Шапка рабочей вкладки с общим адаптивным каркасом. */
import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';
import { WorkspaceAdaptiveHeader } from './workspace-adaptive-header';
import { WorkspaceTabHeading } from './workspace-tab-heading';

/** Содержимое, которое задаёт конкретная вкладка. */
export interface TabHeaderProps {
  /** Иконка вкладки. */
  icon: ReactNode;
  /** Название вкладки. */
  title: string;
  /** Селекторы и управление выбранной областью. */
  children?: ReactNode;
  /** Кнопки, доступные в этой вкладке. */
  actions?: ReactNode;
  /** Дополнительное оформление внешнего контейнера. */
  className?: string;
}

/**
 * Размещает название, область выбора и действия в общем каркасе рабочих вкладок.
 * @param props - Содержимое и оформление вкладки.
 * @returns Шапка рабочей вкладки.
 */
export function TabHeader({ icon, title, children, actions, className }: TabHeaderProps) {
  return (
    <div className={cn('workspace-tab-frame workspace-tab-bar @container shrink-0 border-b border-border/50', className)}>
      <WorkspaceAdaptiveHeader actionsSelector=".workspace-header-tab-tools">
        <WorkspaceTabHeading icon={icon} title={title}
          actions={actions && <div className="workspace-header-tab-tools flex flex-wrap justify-end gap-2">{actions}</div>} />
        {children && <div role="group" aria-label={`Область вкладки «${title}»`}>{children}</div>}
      </WorkspaceAdaptiveHeader>
    </div>
  );
}
