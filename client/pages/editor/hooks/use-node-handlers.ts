/**
 * @fileoverview Хук обработчиков узлов редактора
 *
 * Управляет обновлением, перемещением, удалением и дублированием узлов.
 */

import { useCallback } from 'react';
import type { Node } from '@shared/schema';
import type { BotDataWithSheets } from '@shared/schema';
import {
  logNodeUpdate,
  logNodeTypeChange,
  logNodeIdChange
} from '@/components/editor/properties';
import { migrateKeyboardLayout } from '@/components/editor/properties/utils';

/** Параметры для логирования действий */
interface ActionLogger {
  /** Функция логирования действия */
  onActionLog: (type: string, description: string) => void;
}

/** Результат работы хука обработчиков узлов */
interface UseNodeHandlersResult {
  /** Обработчик обновления узла с синхронизацией листов */
  handleNodeUpdateWithSheets: (nodeId: string, updates: any) => void;
  /** Обработчик смены типа узла с синхронизацией листов */
  handleNodeTypeChange: (nodeId: string, newType: any, newData: any) => void;
  /** Обработчик смены ID узла с синхронизацией листов */
  handleNodeIdChange: (oldId: string, newId: string) => void;
  /** Обработчик перемещения узла */
  handleNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Обработчик начала перемещения узла (для сохранения в историю ДО изменений) */
  handleNodeMoveStart: (nodeId: string) => void;
  /** Обработчик окончания перемещения узла */
  handleNodeMoveEnd: (nodeId: string) => void;
}

/** Параметры хука обработчиков узлов */
interface UseNodeHandlersOptions extends ActionLogger {
  /** Все узлы редактора */
  nodes: Node[];
  /** Функция обновления узла */
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  /** Функция обновления данных узла */
  updateNodeData: (nodeId: string, updates: any) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
  /** Данные с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Функция обновления данных листов */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
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
  updateNodeData,
  onActionLog,
  saveToHistory,
  botDataWithSheets,
  setBotDataWithSheets,
  selectedNodeId,
  setSelectedNodeId
}: UseNodeHandlersOptions): UseNodeHandlersResult {
  const handleNodeUpdateWithSheets = useCallback((nodeId: string, updates: any) => {
    const node = nodes.find(n => n.id === nodeId);
    const updatedFields = Object.keys(updates);

    // Миграция keyboardLayout если нужно
    if (updates.keyboardLayout || updates.buttons) {
      const currentLayout = updates.keyboardLayout || node?.data.keyboardLayout;
      const buttons = updates.buttons || node?.data.buttons || [];
      updates.keyboardLayout = migrateKeyboardLayout(buttons, currentLayout);
    }

    // Логируем только если хотя бы одно поле реально изменилось
    if (node) {
      const changedFields = updatedFields.filter(key => {
        const oldVal = (node.data as any)[key];
        const newVal = updates[key];
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
      });
      if (changedFields.length > 0) {
        logNodeUpdate({ node, onActionLog, updatedFields: changedFields });
      }
    }

    saveToHistory();

    // Обновляем в старой системе
    updateNodeData(nodeId, updates);

    // Синхронизируем с новой системой листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, ...updates } }
                : node
            )
          };
        }
        return sheet;
      });

      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNodeData, botDataWithSheets, setBotDataWithSheets, nodes, onActionLog, saveToHistory]);

  const handleNodeTypeChange = useCallback((nodeId: string, newType: any, newData: any) => {
    const node = nodes.find(n => n.id === nodeId);
    const oldType = node?.type;

    if (node && oldType) {
      logNodeTypeChange({ node, oldType, newType, onActionLog });
    }

    saveToHistory();

    // Обновляем в старой системе
    updateNode(nodeId, { type: newType, data: newData });

    // Синхронизируем с новой системой листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node =>
              node.id === nodeId
                ? { ...node, type: newType, data: newData }
                : node
            )
          };
        }
        return sheet;
      });

      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNode, botDataWithSheets, setBotDataWithSheets, nodes, onActionLog, saveToHistory]);

  const handleNodeIdChange = useCallback((oldId: string, newId: string) => {
    const node = nodes.find(n => n.id === oldId);

    if (node) {
      logNodeIdChange({ node, oldId, newId, onActionLog });
    }

    saveToHistory();

    if (!botDataWithSheets || !botDataWithSheets.activeSheetId) return;

    const updatedSheets = botDataWithSheets.sheets.map(sheet => {
      if (sheet.id === botDataWithSheets.activeSheetId) {
        return {
          ...sheet,
          nodes: sheet.nodes.map(node =>
            node.id === oldId
              ? { ...node, id: newId }
              : node
          )
        };
      }
      return sheet;
    });

    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: updatedSheets
    });

    if (selectedNodeId === oldId && setSelectedNodeId) {
      setSelectedNodeId(newId);
    }
  }, [botDataWithSheets, setBotDataWithSheets, selectedNodeId, setSelectedNodeId, nodes, onActionLog, saveToHistory]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    // Обновляем в старой системе
    updateNode(nodeId, { position });

    // Синхронизируем позицию с новой системой листов
    if (botDataWithSheets && botDataWithSheets.activeSheetId) {
      const updatedSheets = botDataWithSheets.sheets.map(sheet => {
        if (sheet.id === botDataWithSheets.activeSheetId) {
          return {
            ...sheet,
            nodes: sheet.nodes.map(node =>
              node.id === nodeId
                ? { ...node, position }
                : node
            )
          };
        }
        return sheet;
      });

      setBotDataWithSheets({
        ...botDataWithSheets,
        sheets: updatedSheets
      });
    }
  }, [updateNode, botDataWithSheets, setBotDataWithSheets]);

  // Сохраняем состояние ДО начала перемещения
  const handleNodeMoveStart = useCallback((_nodeId: string) => {
    saveToHistory();
  }, [saveToHistory]);

  const handleNodeMoveEnd = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && onActionLog) {
      onActionLog('move_end', `Перемещён узел "${node.type}" (${node.id})`);
    }
  }, [nodes, onActionLog]);

  return {
    handleNodeUpdateWithSheets,
    handleNodeTypeChange,
    handleNodeIdChange,
    handleNodeMove,
    handleNodeMoveStart,
    handleNodeMoveEnd
  };
}
