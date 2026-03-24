/**
 * @fileoverview Панель свойств медиа-ноды
 * Содержит только секцию медиафайлов и автопереход
 */

import { useState } from 'react';
import type { Node } from '@shared/schema';
import { MediaFileSection } from '../media-file/media-file-section';
import { AutoTransitionSection } from '../navigation/auto-transition-section';

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
 * Панель свойств для ноды типа media
 * Показывает секцию медиафайлов и настройку автоперехода
 *
 * @param {MediaNodePropertiesProps} props - Пропсы компонента
 * @returns {JSX.Element} Панель свойств медиа-ноды
 */
export function MediaNodeProperties({
  projectId,
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
}: MediaNodePropertiesProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(true);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(false);

  return (
    <div className="space-y-0">
      <MediaFileSection
        projectId={projectId}
        selectedNode={selectedNode}
        isOpen={isMediaOpen}
        onToggle={() => setIsMediaOpen(!isMediaOpen)}
        onNodeUpdate={onNodeUpdate}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
      />
      <AutoTransitionSection
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        isOpen={isAutoTransitionOpen}
        onToggle={() => setIsAutoTransitionOpen(!isAutoTransitionOpen)}
      />
    </div>
  );
}
