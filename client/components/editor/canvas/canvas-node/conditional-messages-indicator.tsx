/**
 * @fileoverview Компонент индикатора условных сообщений
 * 
 * Отображает блок условных сообщений с заголовком,
 * списком условий и кнопками для каждого условия.
 */

import { Node } from '@/types/bot';
import { ConditionalMessagesHeader } from './conditional-messages-header';
import { ConditionalMessageCard } from './conditional-message-card';
import { ConditionalButtonsList } from './conditional-buttons-list';

/**
 * Интерфейс свойств компонента ConditionalMessagesIndicator
 *
 * @interface ConditionalMessagesIndicatorProps
 * @property {Node} node - Узел с настройками условных сообщений
 * @property {Node[]} [allNodes] - Все узлы для поиска целевых
 */
interface ConditionalMessagesIndicatorProps {
  node: Node;
  allNodes?: Node[];
}

/**
 * Компонент индикатора условных сообщений
 *
 * @component
 * @description Отображает индикатор условных сообщений
 *
 * @param {ConditionalMessagesIndicatorProps} props - Свойства компонента
 * @param {Node} props.node - Узел с настройками
 * @param {Node[]} [props.allNodes] - Все узлы
 *
 * @returns {JSX.Element | null} Компонент индикатора или null если нет условий
 */
export function ConditionalMessagesIndicator({ node, allNodes }: ConditionalMessagesIndicatorProps) {
  if (!node.data.enableConditionalMessages || !node.data.conditionalMessages || node.data.conditionalMessages.length === 0) {
    return null;
  }

  const messages = node.data.conditionalMessages;
  const visibleMessages = messages
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 3);
  const hiddenCount = messages.length - 3;

  return (
    <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/25 dark:to-indigo-900/25 border border-purple-200/50 dark:border-purple-800/40 rounded-xl p-4 mb-4 shadow-sm">
      <ConditionalMessagesHeader count={messages.length} />

      <div className="space-y-2">
        {visibleMessages.map((condition: any) => (
          <ConditionalMessageCard key={condition.id} condition={condition}>
            {condition.buttons && condition.buttons.length > 0 && condition.keyboardType !== 'none' && (
              <ConditionalButtonsList
                buttons={condition.buttons}
                keyboardType={condition.keyboardType}
                allNodes={allNodes}
              />
            )}
          </ConditionalMessageCard>
        ))}

        {hiddenCount > 0 && (
          <div className="text-center py-2">
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-200/30 dark:border-purple-800/30 inline-flex items-center space-x-1">
              <i className="fas fa-ellipsis-h text-xs"></i>
              <span>Еще {hiddenCount} условий</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
