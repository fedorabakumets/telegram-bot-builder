/**
 * @fileoverview Хук обработчиков кнопок редактора
 *
 * Управляет добавлением, обновлением и удалением кнопок узлов.
 */

import { useCallback } from 'react';
import type { Node, Button } from '@shared/schema';
import {
  logButtonAdd,
  logButtonUpdate,
  logButtonDelete
} from '@/components/editor/properties';

/** Параметры для логирования действий */
interface ActionLogger {
  /** Функция логирования действия */
  onActionLog: (type: string, description: string) => void;
}

/** Результат работы хука обработчиков кнопок */
interface UseButtonHandlersResult {
  /** Обработчик добавления кнопки */
  handleButtonAdd: (nodeId: string, button: Button) => void;
  /** Обработчик обновления кнопки */
  handleButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Обработчик удаления кнопки */
  handleButtonDelete: (nodeId: string, buttonId: string) => void;
}

/** Параметры хука обработчиков кнопок */
interface UseButtonHandlersOptions extends ActionLogger {
  /** Все узлы редактора */
  nodes: Node[];
  /** Функция добавления кнопки */
  addButton: (nodeId: string, button: Button) => void;
  /** Функция обновления кнопки */
  updateButton: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Функция удаления кнопки */
  deleteButton: (nodeId: string, buttonId: string) => void;
  /** Функция сохранения в историю */
  saveToHistory: () => void;
}

/**
 * Хук для обработки операций с кнопками
 *
 * @param options - Параметры хука
 * @returns Обработчики кнопок
 */
export function useButtonHandlers({
  nodes,
  addButton,
  updateButton,
  deleteButton,
  onActionLog,
  saveToHistory
}: UseButtonHandlersOptions): UseButtonHandlersResult {
  const handleButtonAdd = useCallback((nodeId: string, button: Button) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      logButtonAdd({
        node,
        buttonText: button.text,
        onActionLog
      });
    }
    saveToHistory();
    addButton(nodeId, button);
  }, [addButton, nodes, onActionLog, saveToHistory]);

  const handleButtonUpdate = useCallback((
    nodeId: string,
    buttonId: string,
    updates: Partial<Button>
  ) => {
    const node = nodes.find(n => n.id === nodeId);
    const updatedFields = Object.keys(updates);
    if (node) {
      logButtonUpdate({
        node,
        buttonId,
        updatedFields,
        onActionLog
      });
    }
    saveToHistory();
    updateButton(nodeId, buttonId, updates);
  }, [updateButton, nodes, onActionLog, saveToHistory]);

  const handleButtonDelete = useCallback((nodeId: string, buttonId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const button = node?.data.buttons?.find(b => b.id === buttonId);
    if (node) {
      logButtonDelete({
        node,
        buttonId,
        buttonText: button?.text,
        onActionLog
      });
    }
    saveToHistory();
    deleteButton(nodeId, buttonId);
  }, [deleteButton, nodes, onActionLog, saveToHistory]);

  return {
    handleButtonAdd,
    handleButtonUpdate,
    handleButtonDelete
  };
}
