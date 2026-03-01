/**
 * @fileoverview Секция контента сообщения
 * 
 * Компонент отображает контент сообщения: медиа-переменные, текст, медиафайлы.
 */

import { MediaVariablesSection } from './media-variables-section';
import { MessageTextSection } from '../message/message-text-section';
import { MediaFileSection } from '../media-file/media-file-section';
import { isManagementNode } from '../../utils/node-constants';
import type { Node } from '@shared/schema';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы компонента */
interface MessageContentSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы проекта */
  allNodes: Node[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Медиа переменные */
  mediaVariables: ProjectVariable[];
  /** Прикреплённые медиа переменные */
  attachedMediaVariables: ProjectVariable[];
  /** Флаг открытости текста сообщения */
  isMessageTextOpen: boolean;
  /** Флаг открытости медиа секции */
  isMediaSectionOpen: boolean;
  /** Функция переключения текста сообщения */
  onMessageTextToggle: () => void;
  /** Функция переключения медиа секции */
  onMediaSectionToggle: () => void;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция удаления медиа переменной */
  onMediaVariableRemove: (name: string) => void;
  /** Функция выбора медиа переменной */
  onMediaVariableSelect?: (name: string, mediaType: string) => void;
  /** ID проекта */
  projectId: number;
}

/**
 * Компонент секции контента сообщения
 * 
 * @param {MessageContentSectionProps} props - Пропсы компонента
 * @returns {JSX.Element | null} Секция контента или null
 */
export function MessageContentSection({
  selectedNode,
  allNodes,
  textVariables,
  mediaVariables,
  attachedMediaVariables,
  isMessageTextOpen,
  isMediaSectionOpen,
  onMessageTextToggle,
  onMediaSectionToggle,
  onNodeUpdate,
  onMediaVariableRemove,
  onMediaVariableSelect,
  projectId
}: MessageContentSectionProps) {
  if (isManagementNode(selectedNode.type)) {
    return null;
  }

  return (
    <div>
      <div className="space-y-4">
        <MediaVariablesSection
          variables={attachedMediaVariables}
          onRemove={onMediaVariableRemove}
        />

        <MessageTextSection
          selectedNode={selectedNode}
          allNodes={allNodes}
          textVariables={textVariables}
          mediaVariables={mediaVariables}
          isOpen={isMessageTextOpen}
          onToggle={onMessageTextToggle}
          onNodeUpdate={onNodeUpdate}
          onMediaVariableSelect={onMediaVariableSelect}
        />

        <MediaFileSection
          projectId={projectId}
          selectedNode={selectedNode}
          isOpen={isMediaSectionOpen}
          onToggle={onMediaSectionToggle}
          onNodeUpdate={onNodeUpdate}
        />
      </div>
    </div>
  );
}
