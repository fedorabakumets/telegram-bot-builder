/**
 * @fileoverview Хук синхронизации условных сообщений с узлами condition на холсте
 *
 * При включении enableConditionalMessages автоматически создаёт узел condition.
 * При изменении условий — обновляет ветки узла.
 * При выключении — удаляет узел condition с холста.
 *
 * @module properties/components/synonyms/use-conditional-messages-sync
 */

import { useCallback } from 'react';
import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';
import type { ConditionBranch } from '@shared/types/condition-node';

/**
 * Пропсы хука useConditionalMessagesSync
 */
interface UseConditionalMessagesSyncProps {
  /** Текущий узел (source) */
  selectedNode: Node;
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
 * Маппинг условия из conditionalMessages в ветку ConditionBranch
 *
 * @param {any} cond - Объект условия
 * @returns {ConditionBranch} Ветка узла condition
 */
function mapConditionToBranch(cond: any): ConditionBranch {
  const varLabel = (cond.variableNames && cond.variableNames[0]) || cond.variableName || '';

  switch (cond.condition) {
    case 'user_data_exists':
      return { id: cond.id, label: varLabel || 'Заполнено', operator: 'filled', value: '' };
    case 'user_data_not_exists':
      return { id: cond.id, label: 'Не заполнено', operator: 'empty', value: '' };
    case 'user_data_equals':
      return { id: cond.id, label: `= ${cond.expectedValue || ''}`, operator: 'equals', value: cond.expectedValue || '' };
    case 'first_time':
      return { id: cond.id, label: 'Первый раз', operator: 'filled', value: '' };
    case 'returning_user':
      return { id: cond.id, label: 'Возвращается', operator: 'filled', value: '' };
    default:
      return { id: cond.id, label: varLabel || cond.condition, operator: 'filled', value: '' };
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
 * Хук синхронизации условных сообщений с узлом condition
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

  /**
   * Находит узел condition, связанный с текущим узлом
   */
  const findConditionNode = useCallback((): Node | undefined => {
    return allNodes.find(n =>
      n.type === 'condition' &&
      (n.data as any).sourceNodeId === selectedNode.id
    );
  }, [allNodes, selectedNode.id]);

  /**
   * Создаёт новый узел condition для текущего узла
   */
  const createConditionNode = useCallback((conditions: any[]): Node => {
    return {
      id: `cond-sync-${nanoid(8)}`,
      type: 'condition',
      position: {
        x: selectedNode.position.x + 300,
        y: selectedNode.position.y - 100,
      },
      data: {
        variable: '',
        branches: buildBranches(conditions),
        sourceNodeId: selectedNode.id,
      } as any,
    };
  }, [selectedNode]);

  /**
   * Обработчик переключения enableConditionalMessages.
   * При включении — создаёт узел condition, при выключении — удаляет.
   *
   * @param {boolean} enabled - Новое значение переключателя
   */
  const handleConditionalMessagesToggle = useCallback((enabled: boolean) => {
    onNodeUpdate(selectedNode.id, { enableConditionalMessages: enabled });

    if (enabled) {
      if (!onNodeAdd) return;
      const existing = findConditionNode();
      if (!existing) {
        const conditions = selectedNode.data.conditionalMessages || [];
        onNodeAdd(createConditionNode(conditions));
      }
    } else {
      if (!onNodeDelete) return;
      const existing = findConditionNode();
      if (existing) onNodeDelete(existing.id);
    }
  }, [selectedNode, onNodeUpdate, onNodeAdd, onNodeDelete, findConditionNode, createConditionNode]);

  /**
   * Обработчик изменения списка условий.
   * Обновляет ветки существующего узла condition или создаёт новый.
   *
   * @param {any[]} conditions - Новый список условий
   */
  const handleConditionalMessagesUpdate = useCallback((conditions: any[]) => {
    onNodeUpdate(selectedNode.id, { conditionalMessages: conditions });

    if (!onNodeAdd || !onNodeDelete) return;

    const existing = findConditionNode();
    const branches = buildBranches(conditions);

    if (existing) {
      onNodeUpdate(existing.id, { branches });
    } else if (selectedNode.data.enableConditionalMessages) {
      onNodeAdd(createConditionNode(conditions));
    }
  }, [selectedNode, onNodeUpdate, onNodeAdd, onNodeDelete, findConditionNode, createConditionNode]);

  return { handleConditionalMessagesToggle, handleConditionalMessagesUpdate };
}
