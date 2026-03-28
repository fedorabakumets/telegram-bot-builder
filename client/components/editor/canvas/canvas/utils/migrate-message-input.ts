/**
 * @fileoverview Миграция legacy message-based input в отдельные `input`-узлы.
 *
 * При загрузке проекта этот модуль находит `message`-узлы со старыми полями
 * сбора ответа и создаёт для них отдельный `input`-узел, если связка ещё
 * не была перенесена. Источник данных при этом не затирается: legacy-поля
 * остаются на `message`, чтобы не потерять обратную совместимость.
 */

import { Node } from '@shared/schema';
import {
  createInputNodeFromMessage,
  hasLegacyMessageInput,
} from '../../../properties/utils/linked-input-node';

/**
 * Мигрирует старую message-based модель сбора ответа в отдельные `input`-узлы.
 *
 * Для каждого `message`:
 * - проверяет наличие legacy-полей
 * - пропускает узлы, у которых уже есть связанный `input`
 * - создаёт новый `input`-узел на основе старых данных
 * - связывает `message` с новым `input` через `autoTransitionTo`
 * - сохраняет исходные legacy-поля на `message`
 *
 * @param {Node[]} nodes - Исходный список узлов листа.
 * @returns {Node[]} Новый список узлов с добавленными `input`-узлами.
 */
export function migrateLegacyMessageInputToLinkedInputs(nodes: Node[]): Node[] {
  const migratedNodes = nodes.map((node) => ({ ...node, data: { ...(node.data as any) } })) as Node[];
  const appendedNodes: Node[] = [];
  let offsetIndex = 0;

  const hasInputNode = (nodeId: string) =>
    [...migratedNodes, ...appendedNodes].some((node) => node.id === nodeId && node.type === 'input');

  for (let index = 0; index < migratedNodes.length; index += 1) {
    const node = migratedNodes[index];
    if (node.type !== 'message') continue;
    if (!hasLegacyMessageInput(node)) continue;

    const linkedNodeId = (node.data as any)?.autoTransitionTo || '';
    if (linkedNodeId && hasInputNode(linkedNodeId)) {
      continue;
    }

    const inputNode = createInputNodeFromMessage(node, offsetIndex);
    offsetIndex += 1;
    appendedNodes.push(inputNode);

    migratedNodes[index] = {
      ...node,
      data: {
        ...(node.data as any),
        collectUserInput: true,
        enableAutoTransition: true,
        autoTransitionTo: inputNode.id,
      },
    } as Node;
  }

  return [...migratedNodes, ...appendedNodes];
}
