/**
 * @fileoverview Секция текста сообщения
 * 
 * Объединяет заголовок, редактор текста и переключатель рассылки.
 */

import { useState } from 'react';
import { MessageTextSectionHeader } from './message-text-section-header';
import { MessageTextSectionContent } from './message-text-section-content';
import { MessageRecipientSection } from './message-recipient-section';
import { BroadcastToggle } from '../broadcast/broadcast-toggle';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';

/** Пропсы секции текста сообщения */
interface MessageTextSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы проекта */
  allNodes: Node[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Медиа-переменные */
  mediaVariables: ProjectVariable[];
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция выбора медиа-переменной */
  onMediaVariableSelect?: (name: string, mediaType: string) => void;
}

/**
 * Компонент секции текста сообщения
 * 
 * @param {MessageTextSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция текста сообщения
 */
export function MessageTextSection({
  selectedNode,
  allNodes,
  textVariables,
  mediaVariables,
  isOpen,
  onToggle,
  onNodeUpdate,
  onMediaVariableSelect
}: MessageTextSectionProps) {
  // Проверяем, есть ли узлы рассылки
  const hasBroadcastNodes = allNodes.some(n => n.type === 'broadcast');
  
  // Состояние фильтров переменных
  const [variableFilters, setVariableFilters] = useState<Record<string, string>>(
    selectedNode.data.variableFilters || {}
  );

  return (
    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
      <MessageTextSectionHeader isOpen={isOpen} onToggle={onToggle} />

      {isOpen && (
        <>
          <MessageTextSectionContent
            nodeId={selectedNode.id}
            messageText={selectedNode.data.messageText || ''}
            markdown={selectedNode.data.markdown}
            _formatMode={selectedNode.data.formatMode}
            availableVariables={[...textVariables, ...mediaVariables] as ProjectVariable[]}
            allNodes={allNodes}
            variableFilters={variableFilters}
            onNodeUpdate={onNodeUpdate}
            onMediaVariableSelect={onMediaVariableSelect}
            onFiltersChange={(filters) => {
              setVariableFilters(filters);
              onNodeUpdate(selectedNode.id, { variableFilters: filters });
            }}
          />
          <MessageRecipientSection
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
            textVariables={[...textVariables, ...mediaVariables] as Variable[]}
          />
        </>
      )}

      {selectedNode.type === 'message' && hasBroadcastNodes && (
        <div className="space-y-3 sm:space-y-4">
          <BroadcastToggle
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
            allNodes={allNodes}
          />
        </div>
      )}
    </div>
  );
}
