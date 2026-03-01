/**
 * @fileoverview Компонент панели выбора и отправки узла
 * @description Использует TargetNodeSelector из панели свойств
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send } from 'lucide-react';
import { TargetNodeSelector } from '@/components/editor/properties/target-node-selector';
import { useSendNode } from '../hooks/use-send-node';
import { useProjectData } from '../hooks/use-project-data';
import { collectNodesFromProjectData } from '../utils/node-utils';
import { formatNodeDisplay } from '@/components/editor/properties/node-formatters';
import type { Node } from '@shared/schema';

/**
 * Свойства компонента NodeSender
 */
export interface NodeSenderProps {
  /** Идентификатор проекта */
  projectId: number;
  /** ID выбранного пользователя */
  userId?: number;
  /** Колбэк после отправки */
  onSent?: () => void;
}

/** Фиктивный узел для совместимости с TargetNodeSelector */
const DUMMY_NODE: Node = {
  id: '',
  type: 'message',
  position: { x: 0, y: 0 },
  data: {},
};

/**
 * Компонент для выбора и отправки узла пользователю
 */
export function NodeSender({ projectId, userId, onSent }: NodeSenderProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { project } = useProjectData(projectId);
  const sendNodeMutation = useSendNode(projectId, onSent);

  const nodesWithSheets = collectNodesFromProjectData(project?.data as Record<string, unknown> | null);

  const handleOptionsUpdate = (updatedOptions: any[]) => {
    if (updatedOptions[0]?.target) {
      setSelectedNodeId(updatedOptions[0].target);
    }
  };

  const dummyOption = {
    id: 'node-sender-option',
    text: 'Выберите узел',
    target: selectedNodeId || undefined,
    action: 'goto' as const,
  };

  return (
    <div className="space-y-2 p-3 border-t border-slate-200/50 dark:border-slate-800/50">
      <TargetNodeSelector
        option={dummyOption}
        index={0}
        getAllNodesFromAllSheets={nodesWithSheets}
        selectedNode={DUMMY_NODE}
        onOptionsUpdate={handleOptionsUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => selectedNodeId && userId && sendNodeMutation.mutate({ nodeId: selectedNodeId, userId })}
          disabled={!selectedNodeId || !userId || sendNodeMutation.isPending}
          className="h-8 text-xs"
        >
          {sendNodeMutation.isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5 mr-1" />
              Отправить узел
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
