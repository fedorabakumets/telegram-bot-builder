/** @fileoverview Упорядочивание и скрытие отдельных кнопок шапки. */
import { Fragment, type ReactNode } from 'react';
import { useCurrentWorkspaceTab, useWorkspaceHeaderPreferences } from './workspace-header-preferences';

/** Кнопка либо составной переключатель в общей шапке. */
export interface WorkspaceHeaderActionItem {
  /** Стабильный ключ независимо от подписи и ширины экрана. */
  id: string;
  /** Готовая кнопка с обработчиком действия. */
  content: ReactNode;
}

/**
 * Выводит действия в пользовательском порядке также для клавиатурной навигации.
 * @param props - Доступные на вкладке действия в стандартном порядке.
 * @returns Список видимых действий.
 */
export function WorkspaceHeaderActionItems({ items, kind = 'actions' }: {
  /** Доступные элементы шапки. */ items: WorkspaceHeaderActionItem[];
  /** Какой набор настроек применяется. */ kind?: 'actions' | 'selectors';
}) {
  const preferences = useWorkspaceHeaderPreferences(useCurrentWorkspaceTab());
  const savedOrder = kind === 'selectors' ? preferences.selectorOrder : preferences.actionOrder;
  const hidden = kind === 'selectors' ? preferences.hiddenSelectors : preferences.hiddenActions;
  const order = new Map(savedOrder.map((id, index) => [id, index]));
  return items.filter(item => !hidden.includes(item.id))
    .sort((first, second) => (order.get(first.id) ?? order.size) - (order.get(second.id) ?? order.size))
    .map(({ id, content }) => <Fragment key={id}>{content}</Fragment>);
}
