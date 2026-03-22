/**
 * @fileoverview Миграция условных сообщений в узлы condition при загрузке проекта
 *
 * При загрузке листа проверяет узлы на наличие поля `enableConditionalMessages === true`
 * и непустого массива `conditionalMessages`. Если условия найдены — создаёт узел condition
 * и узлы message для каждого условия. Исходный узел НЕ изменяется.
 *
 * @module canvas/utils/migrate-conditional-messages
 */

import { Node } from '@shared/schema';
import { nanoid } from 'nanoid';
import type { ConditionBranch } from '@shared/types/condition-node';
import { createMessageNodeForCondition } from '../../../properties/components/synonyms/condition-message-node-factory';

/**
 * Преобразует объект условия из conditionalMessages в ветку узла condition.
 *
 * @param {any} cond - Объект условия из conditionalMessages
 * @returns {ConditionBranch} Ветка для узла condition
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
 * Мигрирует узлы с условными сообщениями в узлы condition + message.
 *
 * Для каждого узла с `enableConditionalMessages === true` и непустым `conditionalMessages`:
 * - проверяет, не существует ли уже узел condition с `sourceNodeId === node.id`
 * - если нет — создаёт узел condition с ветками и узлы message для каждого условия
 * - добавляет ветку `else` в конец списка веток
 * - исходный узел остаётся без изменений
 *
 * @param {Node[]} nodes - Массив узлов листа
 * @returns {Node[]} Новый массив узлов с добавленными condition и message узлами
 */
export function migrateConditionalMessagesToConditionNodes(nodes: Node[]): Node[] {
  /** Результирующий массив — исходные узлы без изменений */
  const result: Node[] = [...nodes];
  /** Новые узлы condition и message, добавляемые в конце */
  const newNodes: Node[] = [];

  for (const node of nodes) {
    const data = node.data as any;

    if (!data.enableConditionalMessages) continue;

    const conditionalMessages: any[] = data.conditionalMessages || [];
    if (conditionalMessages.length === 0) continue;

    // Проверяем: уже есть узел condition для этого исходного узла?
    const alreadyExists = nodes.some(
      n => n.type === 'condition' && (n.data as any).sourceNodeId === node.id
    );
    if (alreadyExists) continue;

    /** ID нового узла condition */
    const conditionNodeId = `cond-sync-${nanoid(8)}`;

    /** Ветки из условий */
    const branches: ConditionBranch[] = conditionalMessages.map(mapConditionToBranch);

    /**
     * Ветка else указывает на исходный узел — он отправляется,
     * если ни одно из условий не выполнено
     */
    const elseBranch: ConditionBranch = { id: 'else', label: 'Иначе', operator: 'else', value: '', target: node.id };
    branches.push(elseBranch);

    /** Узел condition */
    const conditionNode: Node = {
      id: conditionNodeId,
      type: 'condition',
      position: {
        x: node.position.x + 300,
        y: node.position.y - 100,
      },
      data: {
        variable: '',
        branches,
        sourceNodeId: node.id,
      } as any,
    };

    newNodes.push(conditionNode);

    /**
     * Перенаправляем триггеры: узлы, ведущие к исходному узлу (autoTransitionTo === node.id),
     * теперь должны вести к condition-узлу, чтобы сначала выполнялось ветвление
     */
    for (let i = 0; i < result.length; i++) {
      const n = result[i];
      if ((n.data as any)?.autoTransitionTo === node.id) {
        result[i] = {
          ...n,
          data: {
            ...(n.data as any),
            autoTransitionTo: conditionNodeId,
          },
        };
      }
    }

    // Создаём узлы message для каждого условия
    conditionalMessages.forEach((cond, index) => {
      const messageNode = createMessageNodeForCondition(cond, conditionNodeId, node, index);
      newNodes.push(messageNode);
    });
  }

  return [...result, ...newNodes];
}
