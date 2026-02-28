/**
 * @fileoverview Компонент выбора узла из проекта
 * @description Выпадающий список с доступными узлами для отправки
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Node } from '@shared/schema';
import { formatNodeDisplay } from '../utils/node-utils';

/**
 * Свойства компонента NodeSelector
 */
export interface NodeSelectorProps {
  /** Массив узлов для выбора с информацией о листе */
  nodesWithSheets: Array<{ node: Node; sheetName: string }>;
  /** Выбранный ID узла */
  selectedNodeId?: string;
  /** Функция выбора узла */
  onSelectNode: (nodeId: string) => void;
  /** Флаг загрузки */
  isLoading?: boolean;
}

/**
 * Типы узлов, которые можно отправлять
 */
const SENDABLE_NODE_TYPES = ['start', 'message', 'command'] as const;

/**
 * Получить иконку для типа узла
 */
function getNodeIcon(type: Node['type']): string {
  switch (type) {
    case 'start':
      return '🚀';
    case 'message':
      return '💬';
    case 'command':
      return '⚙️';
    default:
      return '📦';
  }
}

/**
 * Компонент выпадающего списка для выбора узла
 */
export function NodeSelector({
  nodesWithSheets,
  selectedNodeId,
  onSelectNode,
  isLoading = false,
}: NodeSelectorProps) {
  const sendableNodes = nodesWithSheets.filter(({ node }) =>
    SENDABLE_NODE_TYPES.includes(node.type as typeof SENDABLE_NODE_TYPES[number])
  );

  return (
    <Select
      value={selectedNodeId}
      onValueChange={onSelectNode}
      disabled={isLoading || sendableNodes.length === 0}
    >
      <SelectTrigger className="w-full h-9 text-xs">
        <SelectValue placeholder="⊘ Выберите узел для отправки..." />
      </SelectTrigger>
      <SelectContent className="max-h-48 overflow-y-auto">
        {sendableNodes.map(({ node, sheetName }) => (
          <SelectItem key={node.id} value={node.id}>
            <div className="flex items-center gap-2">
              <span>{getNodeIcon(node.type)}</span>
              <span className="truncate max-w-[200px]">
                {formatNodeDisplay(node, sheetName)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
