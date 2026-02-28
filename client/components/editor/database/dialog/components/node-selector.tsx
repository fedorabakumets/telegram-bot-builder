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
  selectedNodeId?: string | null;
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
    case 'sticker':
      return '🎭';
    case 'voice':
      return '🎤';
    case 'animation':
      return '🎬';
    case 'location':
      return '📍';
    case 'contact':
      return '📇';
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

  const handleValueChange = (value: string) => {
    onSelectNode(value);
  };

  return (
    <Select
      value={selectedNodeId || ''}
      onValueChange={handleValueChange}
      disabled={isLoading || sendableNodes.length === 0}
    >
      <SelectTrigger className="w-full h-8 text-xs bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 focus:border-blue-500 focus:ring-blue-400/30">
        <SelectValue placeholder="⊘ Не выбрано" />
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
        {sendableNodes.map(({ node, sheetName }) => {
          const display = formatNodeDisplay(node, sheetName);
          const icon = getNodeIcon(node.type);
          
          return (
            <SelectItem key={node.id} value={node.id}>
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate max-w-[250px]">
                  {display}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
