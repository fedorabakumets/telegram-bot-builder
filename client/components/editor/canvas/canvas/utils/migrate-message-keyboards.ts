/**
 * @fileoverview Миграция legacy-клавиатур из `message` в отдельные `keyboard`-узлы.
 *
 * При загрузке проекта этот модуль находит `message`-узлы со встроенными кнопками
 * и переносит клавиатурные данные в отдельный `keyboard`-узел, связывая его через
 * `keyboardNodeId`. Это позволяет привести старую модель canvas к новой, где
 * клавиатура редактируется отдельной нодой.
 */

import { Node } from '@shared/schema';
import { generateNewId } from './extract-base-id';
import { getKeyboardNodeId, setKeyboardNodeId } from '../../canvas-node/keyboard-connection';

const TRANSFERRED_KEYBOARD_KEYS = [
  'keyboardType',
  'buttons',
  'keyboardLayout',
  'oneTimeKeyboard',
  'resizeKeyboard',
  'allowMultipleSelection',
  'multiSelectVariable',
  'continueButtonText',
  'continueButtonTarget',
] as const;

function cloneValue<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function hasLinkedKeyboard(nodes: Node[], keyboardNodeId: string | null): boolean {
  if (!keyboardNodeId) return false;
  return nodes.some((node) => node.id === keyboardNodeId && node.type === 'keyboard');
}

function resolveKeyboardType(data: Record<string, unknown>): 'inline' | 'reply' {
  return data.keyboardType === 'reply' ? 'reply' : 'inline';
}

function hasMigratableButtons(data: Record<string, unknown>): boolean {
  return Array.isArray(data.buttons) && data.buttons.length > 0;
}

/**
 * Переносит встроенные кнопки `message` в отдельные `keyboard`-узлы.
 *
 * Правила:
 * - мигрируем только `message`-узлы с непустыми `buttons`
 * - если linked `keyboard` уже существует, узел пропускается
 * - если `keyboardNodeId` уже указан, но нода отсутствует, переиспользуем этот ID
 * - данные клавиатуры удаляются из `message`, чтобы не дублировать UI
 */
export function migrateMessageKeyboardsToNodes(nodes: Node[]): Node[] {
  const migratedNodes = nodes.map((node) => ({
    ...node,
    data: { ...(node.data as Record<string, unknown>) },
  })) as Node[];
  const appendedNodes: Node[] = [];

  for (let index = 0; index < migratedNodes.length; index += 1) {
    const node = migratedNodes[index];
    if (node.type !== 'message') continue;

    const nodeData = node.data as Record<string, unknown>;
    if (!hasMigratableButtons(nodeData)) continue;

    const existingKeyboardNodeId = getKeyboardNodeId(nodeData);
    if (hasLinkedKeyboard([...migratedNodes, ...appendedNodes], existingKeyboardNodeId)) {
      continue;
    }

    const keyboardNodeId = existingKeyboardNodeId || generateNewId(node.id, 'keyboard');
    const keyboardData: Record<string, unknown> = {
      keyboardType: resolveKeyboardType(nodeData),
      buttons: cloneValue(nodeData.buttons) || [],
      oneTimeKeyboard: Boolean(nodeData.oneTimeKeyboard),
      resizeKeyboard: nodeData.resizeKeyboard !== false,
    };

    for (const key of TRANSFERRED_KEYBOARD_KEYS) {
      const value = nodeData[key];
      if (value !== undefined) {
        keyboardData[key] = cloneValue(value);
      }
    }

    const keyboardNode: Node = {
      id: keyboardNodeId,
      type: 'keyboard',
      position: {
        x: node.position.x + 360,
        y: node.position.y,
      },
      data: keyboardData as Node['data'],
    };

    const nextMessageData = setKeyboardNodeId(nodeData, keyboardNodeId) as Record<string, unknown>;
    for (const key of TRANSFERRED_KEYBOARD_KEYS) {
      delete nextMessageData[key];
    }
    nextMessageData.keyboardType = 'none';
    nextMessageData.buttons = [];

    migratedNodes[index] = {
      ...node,
      data: nextMessageData as Node['data'],
    };
    appendedNodes.push(keyboardNode);
  }

  return [...migratedNodes, ...appendedNodes];
}
