/** @fileoverview Выбор блока, который запускает триггер. */
import type { Node } from '@shared/schema';
import { NextBlockSelect } from '../navigation/auto-transition-section';

interface TriggerTargetSelectorProps {
  selectedNode: Node;
  autoTransitionTo?: string;
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

export function TriggerTargetSelector({
  selectedNode,
  autoTransitionTo,
  getAllNodesFromAllSheets = [],
  onNodeUpdate,
  formatNodeDisplay,
}: TriggerTargetSelectorProps) {
  return (
    <NextBlockSelect
      label="Следующий блок"
      selectedNode={selectedNode}
      getAllNodesFromAllSheets={getAllNodesFromAllSheets}
      display={formatNodeDisplay}
      target={autoTransitionTo}
      onChange={(id) => onNodeUpdate(selectedNode.id, { autoTransitionTo: id })}
    />
  );
}