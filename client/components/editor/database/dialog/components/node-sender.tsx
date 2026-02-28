/**
 * @fileoverview Компонент панели выбора и отправки узла
 * @description Выпадающий список с узлами и кнопка отправки
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send } from 'lucide-react';
import { NodeSelector } from './node-selector';
import { useSendNode } from '../hooks/use-send-node';
import { useProjectData } from '../hooks/use-project-data';
import { collectNodesFromProjectData } from '../utils/node-utils';
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

/**
 * Компонент для выбора и отправки узла пользователю
 */
export function NodeSender({ projectId, userId, onSent }: NodeSenderProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { project, isLoading } = useProjectData(projectId);
  const sendNodeMutation = useSendNode(projectId, onSent);

  const nodesWithSheets = collectNodesFromProjectData(project?.data as Record<string, unknown> | null);

  const handleSend = () => {
    if (selectedNodeId && userId) {
      sendNodeMutation.mutate({
        nodeId: selectedNodeId,
        userId,
      });
    }
  };

  return (
    <div className="space-y-2 p-3 border-t border-slate-200/50 dark:border-slate-800/50">
      <NodeSelector
        nodesWithSheets={nodesWithSheets}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        isLoading={isLoading}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSend}
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
