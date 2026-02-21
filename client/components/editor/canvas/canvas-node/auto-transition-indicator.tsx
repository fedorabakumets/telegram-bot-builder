/**
 * @fileoverview Компонент индикатора автоперехода
 * 
 * Отображает визуальное представление автоперехода между узлами,
 * включая информацию о целевом узле.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента AutoTransitionIndicator
 *
 * @interface AutoTransitionIndicatorProps
 * @property {Node} node - Узел с настройками автоперехода
 * @property {Node[]} [allNodes] - Все узлы на холсте для поиска целевого
 */
interface AutoTransitionIndicatorProps {
  node: Node;
  allNodes?: Node[];
}

/**
 * Компонент индикатора автоперехода
 *
 * @component
 * @description Отображает индикатор автоперехода к другому узлу
 *
 * @param {AutoTransitionIndicatorProps} props - Свойства компонента
 * @param {Node} props.node - Узел с настройками автоперехода
 * @param {Node[]} [props.allNodes] - Все узлы для поиска целевого
 *
 * @returns {JSX.Element | null} Компонент индикатора или null если нет автоперехода
 */
export function AutoTransitionIndicator({ node, allNodes }: AutoTransitionIndicatorProps) {
  if (!node.data.enableAutoTransition || !node.data.autoTransitionTo) {
    return null;
  }

  const targetNode = allNodes?.find(n => n.id === node.data.autoTransitionTo);
  const targetNodeName = targetNode?.data.messageText?.slice(0, 30) || targetNode?.data.command || targetNode?.id.slice(0, 8);

  return (
    <div className="bg-gradient-to-br from-emerald-50/70 to-green-50/70 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 mb-4 border border-emerald-200 dark:border-emerald-800/30">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <i className="fas fa-arrow-right text-emerald-600 dark:text-emerald-400 text-sm"></i>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
            Автопереход
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">
            {targetNode ? (
              <>
                К узлу: <span className="font-semibold">{targetNodeName}</span>
                {targetNode.data.messageText && targetNode.data.messageText.length > 30 && '...'}
              </>
            ) : (
              `К узлу: ${node.data.autoTransitionTo.slice(0, 8)}...`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
