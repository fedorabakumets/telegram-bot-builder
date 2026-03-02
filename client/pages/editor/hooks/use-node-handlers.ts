/**
 * @fileoverview Хук обработчиков узлов редактора
 *
 * Управляет обновлением, перемещением, удалением и дублированием узлов.
 */

import { useCallback } from 'react';
import type { Node } from '@shared/schema';
import {
  logNodeUpdate,
  logNodeTypeChange,
  logNodeIdChange
} from '@/components/editor/properties';
import { migrateKeyboardLayout, fixAutoLayout } from '@/components/editor/properties/utils';

/** Параметры для логирования действий */
interface ActionLogger {
  /** Функция логирования действия */
  onActionLog: (type: string, description: string) => void;
}

/** Результат работы хука обработчиков узлов */
interface UseNodeHandlersResult {
  /** Обработчик обновления узла */
  handleNodeUpdate: (nodeId: string, updates: any) => void;
  /** Обработчик смены типа узла */
  handleNodeTypeChange: (nodeId: string, newType: any, newData: any) => void;
  /** Обработчик смены ID узла */
  handleNodeIdChange: (oldId: string, newId: string) => void;
  /** Обработчик перемещения узла */
  handleNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Обработчик окончания перемещения узла */
  handleNodeMoveEnd: (nodeId: string) => void;
}

/** Параметры хука обработчиков узлов */
interface UseNodeHandlersOptions extends ActionLogger {
  /** Все узлы редактора */
  nodes: Node[];
  /** Функция обновления узла */
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
  /** Выбранный ID узла */
  selectedNodeId?: string | null;
  /** Функция установки выбранного узла */
  setSelectedNodeId?: (id: string) => void;
}

/**
 * Хук для обработки операций с узлами
 *
 * @param options - Параметры хука
 * @returns Обработчики узлов
 */
export function useNodeHandlers({
  nodes,
  updateNode,
  onActionLog,
  saveToHistory,
  selectedNodeId,
  setSelectedNodeId
}: UseNodeHandlersOptions): UseNodeHandlersResult {
  const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
    const node = nodes.find(n => n.id === nodeId);
    const updatedFields = Object.keys(updates);

    // Миграция keyboardLayout если нужно
    if (updates.keyboardLayout || updates.buttons) {
      const currentLayout = updates.keyboardLayout || node?.data.keyboardLayout;
      const buttons = updates.buttons || node?.data.buttons || [];
      updates.keyboardLayout = migrateKeyboardLayout(buttons, currentLayout);
      updates.keyboardLayout = fixAutoLayout(updates.keyboardLayout, buttons.length);
    }

    if (node) {
      logNodeUpdate({ node, onActionLog, updatedFields });
    }

    saveToHistory();
    updateNode(nodeId, updates);
  }, [updateNode, nodes, onActionLog, saveToHistory]);

  const handleNodeTypeChange = useCallback((nodeId: string, newType: any, newData: any) => {
    const node = nodes.find(n => n.id === nodeId);
    const oldType = node?.type;

    if (node && oldType) {
      logNodeTypeChange({ node, oldType, newType, onActionLog });
    }

    saveToHistory();
    updateNode(nodeId, { type: newType, data: newData });
  }, [updateNode, nodes, onActionLog, saveToHistory]);

  const handleNodeIdChange = useCallback((oldId: string, newId: string) => {
    const node = nodes.find(n => n.id === oldId);

    if (node) {
      logNodeIdChange({ node, oldId, newId, onActionLog });
    }

    saveToHistory();

    if (selectedNodeId === oldId && setSelectedNodeId) {
      setSelectedNodeId(newId);
    }
  }, [nodes, onActionLog, saveToHistory, selectedNodeId, setSelectedNodeId]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
  }, [updateNode]);

  const handleNodeMoveEnd = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && onActionLog) {
      onActionLog('move_end', `Перемещён узел "${node.type}" (${node.id})`);
    }
    saveToHistory();
  }, [nodes, onActionLog, saveToHistory]);

  return {
    handleNodeUpdate,
    handleNodeTypeChange,
    handleNodeIdChange,
    handleNodeMove,
    handleNodeMoveEnd
  };
}
