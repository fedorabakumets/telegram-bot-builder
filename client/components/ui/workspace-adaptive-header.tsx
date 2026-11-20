/** @fileoverview Общая адаптивная строка шапки с автоматическим сокращением действий. */
import type { ReactNode } from 'react';
import { useWorkspaceHeaderSpace } from './use-workspace-header-space';
import { useCurrentWorkspaceTab, useWorkspaceHeaderPreferences } from './workspace-header-preferences';
import './workspace-adaptive-header.css';

/** Содержимое и точки измерения выбранной области вкладки. */
interface WorkspaceAdaptiveHeaderProps {
  /** Заголовок, селекторы и дополнительные действия. */ children: ReactNode;
  /** Оформление конкретного раздела. */ className?: string;
  /** Контейнер области вкладки, если он предусмотрен. */ scopeSelector?: string;
  /** Контейнер служебных действий. */ actionsSelector?: string;
}

/**
 * Объединяет содержимое шапки и измерение места для подписей.
 * @param props - Содержимое и оформление раздела
 * @returns Адаптивная строка рабочей вкладки
 */
export function WorkspaceAdaptiveHeader({ children, className = '', scopeSelector = "[role='group']", actionsSelector = '.workspace-tab-actions' }: WorkspaceAdaptiveHeaderProps) {
  const tab = useCurrentWorkspaceTab();
  const preferences = useWorkspaceHeaderPreferences(tab);
  const { showIcon, selectorsBelow, actionsBelow } = preferences;
  const ref = useWorkspaceHeaderSpace(scopeSelector, actionsSelector, preferences);
  return (
    <div ref={ref} className={`workspace-adaptive-header ${className}`}
      data-hide-icon={!showIcon || undefined}
      data-selectors-below={selectorsBelow || undefined}
      data-actions-below={actionsBelow || undefined}>
      {children}
    </div>
  );
}
