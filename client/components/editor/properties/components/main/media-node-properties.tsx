/**
 * @fileoverview Панель свойств медиа-ноды
 * Содержит секцию медиафайлов, автопереход и список получателей.
 */

import { useState, useMemo } from 'react';
import type { Node } from '@shared/schema';
import type { Variable } from '../../../inline-rich/types';
import { MediaFileSection } from '../media-file/media-file-section';
import { AutoTransitionSection } from '../navigation/auto-transition-section';
import { MessageRecipientSection } from '../message/message-recipient-section';
import { extractVariables } from '../../utils/variables-utils';

/** Пропсы панели свойств медиа-ноды */
interface MediaNodePropertiesProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Панель свойств для ноды типа media.
 * Показывает секцию медиафайлов, настройку автоперехода и список получателей.
 *
 * @param props - Пропсы компонента
 * @returns JSX элемент панели свойств медиа-ноды
 */
export function MediaNodeProperties({
  projectId,
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
}: MediaNodePropertiesProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(true);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(false);

  /** Текстовые переменные для вставки в поля получателей */
  const textVariables = useMemo((): Variable[] => {
    const nodes = getAllNodesFromAllSheets.map((n: any) => n.node || n);
    const { textVariables: vars } = extractVariables(nodes);
    return vars as Variable[];
  }, [getAllNodesFromAllSheets]);

  return (
    <div className="space-y-0">
      <MediaFileSection
        projectId={projectId}
        selectedNode={selectedNode}
        isOpen={isMediaOpen}
        onToggle={() => setIsMediaOpen(!isMediaOpen)}
        onNodeUpdate={onNodeUpdate}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        showComingSoon={false}
      />
      <AutoTransitionSection
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        isOpen={isAutoTransitionOpen}
        onToggle={() => setIsAutoTransitionOpen(!isAutoTransitionOpen)}
      />
      <MessageRecipientSection
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
        textVariables={textVariables}
      />
    </div>
  );
}
