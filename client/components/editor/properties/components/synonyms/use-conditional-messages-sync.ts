/**
 * @fileoverview Хук синхронизации условных сообщений с узлами condition на холсте
 *
 * При включении enableConditionalMessages автоматически создаёт узел condition
 * и узлы-сообщения для каждого условия.
 * При изменении условий — обновляет ветки узла condition и данные узлов-сообщений.
 * При выключении — удаляет узел condition и все связанные узлы-сообщения.
 *
 * @module properties/components/synonyms/use-conditional-messages-sync
 */

import { useCallback, useEffect } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';
import type { ConditionBranch } from '@shared/types/condition-node';
import { createMessageNodeForCondition, getMessageNodeUpdates } from './condition-message-node-factory';

/**
 * Пропсы хука useConditionalMessagesSync
 */
interface UseConditionalMessagesSyncProps {
  /** Текущий узел (source), может быть null когда узел не выбран */
  selectedNode: Node | null;
  /** Все узлы листа */
  allNodes: Node[];
  /** Обновить данные узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Добавить узел на холст */
  onNodeAdd?: (node: Node) => void;
  /** Удалить узел с холста */
  onNodeDelete?: (nodeId: string) => void;
}

/**
 * Маппинг условия из conditionalMessages в ветку ConditionBranch.
 * Каждая ветка содержит target — ID узла-сообщения для этого условия.
 *
 * @param {any} cond - Объект условия
 * @returns {ConditionBranch} Ветка узла condition
 */
function mapConditionToBranch(cond: any): ConditionBranch {
  const varLabel = (cond.variableNames && cond.variableNames[0]) || cond.variableName || '';
  const target = `msg-cond-${cond.id}`;

  switch (cond.condition) {
    case 'user_data_exists':
      return { id: cond.id, label: varLabel || 'Заполнено', operator: 'filled', value: '', target };
    case 'user_data_not_exists':
      return { id: cond.id, label: 'Не заполнено', operator: 'empty', value: '', target };
    case 'user_data_equals':
      return { id: cond.id, label: `= ${cond.expectedValue || ''}`, operator: 'equals', value: cond.expectedValue || '', target };
    case 'first_time':
      return { id: cond.id, label: 'Первый раз', operator: 'filled', value: '', target };
    case 'returning_user':
      return { id: cond.id, label: 'Возвращается', operator: 'filled', value: '', target };
    default:
      return { id: cond.id, label: varLabel || cond.condition, operator: 'filled', value: '', target };
  }
}

/**
 * Строит массив веток из списка условий (+ ветка else в конце)
 *
 * @param {any[]} conditions - Список условий
 * @returns {ConditionBranch[]} Ветки узла condition
 */
function buildBranches(conditions: any[]): ConditionBranch[] {
  const branches: ConditionBranch[] = conditions.map(mapConditionToBranch);
  branches.push({ id: 'else', label: 'Иначе', operator: 'else', value: '' });
  return branches;
}

/**
 * Хук синхронизации условных сообщений с узлом condition и узлами-сообщениями
 *
 * @param props - Пропсы хука
 * @returns handleConditionalMessagesToggle, handleConditionalMessagesUpdate
 */
export function useConditionalMessagesSync({
  selectedNode,
  allNodes,
  onNodeUpdate,
  onNodeAdd,
  onNodeDelete,
}: UseConditionalMessagesSyncProps) {

  /** Находит узел condition, связанный с текущим узлом */
  const findConditionNode = useCallback((): Node | undefined => {
    if (!selectedNode) return undefined;
    return allNodes.find(n =>
      n.type === 'condition' &&
      (n.data as any).sourceNodeId === selectedNode.id
    );
  }, [allNodes, selectedNode]);

  /** Находит узел-сообщение по ID условия */
  const findMessageNodeForCond = useCallback((condId: string): Node | undefined => {
    return allNodes.find(n =>
      n.type === 'message' &&
      (n.data as any).condSourceId === condId
    );
  }, [allNodes]);

  /**
   * Создаёт узел condition и узлы-сообщения для каждого условия.
   * Возвращает массив: [conditionNode, ...messageNodes]
   */
  const createConditionNodes = useCallback((conditions: any[]): Node[] => {
    if (!selectedNode) return [];

    /** Переменная из первого условия */
    const firstCond = conditions[0];
    const primaryVariable = (firstCond?.variableNames && firstCond.variableNames[0])
      || firstCond?.variableName
      || '';

    const conditionNode: Node = {
      id: `cond-sync-${nanoid(8)}`,
      type: 'condition',
      position: {
        x: selectedNode.position.x + 300,
        y: selectedNode.position.y - 100,
      },
      data: {
        variable: primaryVariable,
        branches: buildBranches(conditions),
        sourceNodeId: selectedNode.id,
      } as any,
    };

    const messageNodes = conditions.map((cond, index) =>
      createMessageNodeForCondition(cond, conditionNode.id, selectedNode, index)
    );

    return [conditionNode, ...messageNodes];
  }, [selectedNode]);

  /**
   * При включении — создаёт condition + message узлы.
   * При выключении — удаляет их все.
   */
  const handleConditionalMessagesToggle = useCallback((enabled: boolean) => {
    if (!selectedNode) return;
    onNodeUpdate(selectedNode.id, { enableConditionalMessages: enabled });

    if (enabled) {
      if (!onNodeAdd) return;
      const existing = findConditionNode();
      if (!existing) {
        const conditions = selectedNode.data.conditionalMessages || [];
        createConditionNodes(conditions).forEach(n => onNodeAdd(n));
      }
    } else {
      if (!onNodeDelete) return;
      const existing = findConditionNode();
      if (existing) onNodeDelete(existing.id);
      const conditions: any[] = selectedNode.data.conditionalMessages || [];
      conditions.forEach(cond => {
        const msgNode = findMessageNodeForCond(cond.id);
        if (msgNode) onNodeDelete(msgNode.id);
      });
    }
  }, [selectedNode, onNodeUpdate, onNodeAdd, onNodeDelete, findConditionNode, findMessageNodeForCond, createConditionNodes]);

  /**
   * При изменении условий — синхронизирует condition-ветки и message-узлы.
   */
  const handleConditionalMessagesUpdate = useCallback((conditions: any[]) => {
    if (!selectedNode) return;
    const oldConditions: any[] = selectedNode.data.conditionalMessages || [];
    onNodeUpdate(selectedNode.id, { conditionalMessages: conditions });

    if (!onNodeAdd || !onNodeDelete) return;

    const existing = findConditionNode();
    if (existing) {
      onNodeUpdate(existing.id, { branches: buildBranches(conditions) });
    } else if (selectedNode.data.enableConditionalMessages) {
      createConditionNodes(conditions).forEach(n => onNodeAdd(n));
      return;
    }

    // Синхронизируем message-узлы
    conditions.forEach((cond, index) => {
      const msgNode = findMessageNodeForCond(cond.id);
      if (msgNode) {
        onNodeUpdate(msgNode.id, getMessageNodeUpdates(cond, selectedNode));
      } else if (selectedNode.data.enableConditionalMessages) {
        onNodeAdd(createMessageNodeForCondition(cond, existing?.id ?? '', selectedNode, index));
      }
    });

    // Удаляем message-узлы для удалённых условий
    const newIds = new Set(conditions.map(c => c.id));
    oldConditions.filter(c => !newIds.has(c.id)).forEach(c => {
      const msgNode = findMessageNodeForCond(c.id);
      if (msgNode) onNodeDelete(msgNode.id);
    });
  }, [selectedNode, onNodeUpdate, onNodeAdd, onNodeDelete, findConditionNode, findMessageNodeForCond, createConditionNodes]);

  /**
   * Инициализация: при выборе узла с уже включёнными условными сообщениями
   * создаём недостающие узлы на холсте.
   */
  useEffect(() => {
    if (!selectedNode?.data.enableConditionalMessages || !onNodeAdd) return;

    const existing = findConditionNode();
    if (!existing) {
      const conditions = selectedNode.data.conditionalMessages || [];
      createConditionNodes(conditions).forEach(n => onNodeAdd(n));
      return;
    }

    // Condition-узел есть — проверяем message-узлы
    const conditions: any[] = selectedNode.data.conditionalMessages || [];
    conditions.forEach((cond, index) => {
      if (!findMessageNodeForCond(cond.id)) {
        onNodeAdd(createMessageNodeForCondition(cond, existing.id, selectedNode, index));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  return { handleConditionalMessagesToggle, handleConditionalMessagesUpdate };
}
