/**
 * @fileoverview Миграция поля autoTransitionTo в inputTargetNodeId для input-узлов
 *
 * Старые input-узлы хранили переход в autoTransitionTo.
 * После рефакторинга правильное поле — inputTargetNodeId.
 * Эта миграция переносит значение при загрузке проекта.
 *
 * @module canvas/utils/migrate-input-node-target
 */

import { Node } from '@shared/schema';

/**
 * Мигрирует autoTransitionTo → inputTargetNodeId для узлов типа input.
 *
 * Если у input-узла заполнен autoTransitionTo, но пустой inputTargetNodeId —
 * копирует значение в inputTargetNodeId и очищает autoTransitionTo.
 *
 * @param nodes - Массив узлов листа
 * @returns Новый массив узлов с исправленными input-узлами
 */
export function migrateInputNodeTarget(nodes: Node[]): Node[] {
  return nodes.map(node => {
    if (node.type !== 'input') return node;

    const data = node.data as any;
    const autoTransitionTo: string = data.autoTransitionTo || '';
    const inputTargetNodeId: string = data.inputTargetNodeId || '';

    // Миграция нужна только если autoTransitionTo заполнен, а inputTargetNodeId — нет
    if (!autoTransitionTo || inputTargetNodeId) return node;

    return {
      ...node,
      data: {
        ...data,
        inputTargetNodeId: autoTransitionTo,
        autoTransitionTo: '',
        enableAutoTransition: false,
      },
    };
  });
}
