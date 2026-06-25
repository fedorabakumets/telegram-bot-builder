/**
 * @fileoverview Авто-нормализация (вынос) инлайн/reply-клавиатур message-нод в отдельные keyboard-ноды.
 * @description Серверно-авторитетный порт клиентской миграции
 * `migrateMessageKeyboardsToNodes` (client/.../utils/migrate-message-keyboards.ts),
 * очищенный от React/DOM-зависимостей. Используется в lib-мутациях project.json
 * (addNodeToProject / updateNodeInProject), чтобы MCP-путь записи приводил кнопки
 * message к каноничной модели: сами кнопки живут в отдельной keyboard-ноде, а
 * message ссылается на неё через keyboardNodeId. Идемпотентна: повторный вызов не
 * плодит дубли keyboard-нод.
 * @module lib/bot-tools/hoist-keyboard
 */

import type { Node } from '@shared/schema';

/**
 * Ключи data, переносимые из message в создаваемую keyboard-ноду.
 * Зеркало клиентского TRANSFERRED_KEYBOARD_KEYS.
 */
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

/**
 * Глубокая копия значения через JSON (для отвязки ссылок при переносе кнопок).
 * @param value - Исходное значение
 * @returns Глубокая копия (undefined остаётся undefined)
 */
function cloneValue<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/**
 * Извлекает базовый id ноды, срезая суффиксы копирования (_paste_/_copy_).
 * Портировано из клиентского getBaseId.
 * @param id - Идентификатор ноды
 * @returns Базовый id без суффиксов копирования
 */
function getBaseId(id: string): string {
  return id.replace(/(_paste_\d+_[a-z0-9]+|_copy_\d+)+$/, '');
}

/**
 * Генерирует новый уникальный id на основе базового id с заданным суффиксом.
 * Портировано из клиентского generateNewId (без внешних зависимостей).
 * @param id - Исходный id ноды
 * @param suffix - Префикс суффикса (по умолчанию 'keyboard')
 * @returns Новый уникальный id вида `${baseId}_${suffix}_<ts>_<rand>`
 */
function generateNewId(id: string, suffix = 'keyboard'): string {
  const baseId = getBaseId(id);
  return `${baseId}_${suffix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Возвращает привязанный id keyboard-ноды из данных message-ноды.
 * @param data - Данные ноды
 * @returns id keyboard-ноды или null
 */
function getKeyboardNodeId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const keyboardNodeId = (data as { keyboardNodeId?: unknown }).keyboardNodeId;
  return typeof keyboardNodeId === 'string' && keyboardNodeId.trim() ? keyboardNodeId : null;
}

/**
 * Проверяет, существует ли в массиве нод привязанная keyboard-нода с данным id.
 * @param nodes - Список нод (включая уже добавленные на этой итерации)
 * @param keyboardNodeId - Искомый id keyboard-ноды
 * @returns true, если keyboard-нода с таким id существует
 */
function hasLinkedKeyboard(nodes: Node[], keyboardNodeId: string | null): boolean {
  if (!keyboardNodeId) return false;
  return nodes.some((node) => node.id === keyboardNodeId && node.type === 'keyboard');
}

/**
 * Определяет тип выносимой клавиатуры: 'reply' либо 'inline' по умолчанию.
 * @param data - Данные message-ноды
 * @returns 'inline' или 'reply'
 */
function resolveKeyboardType(data: Record<string, unknown>): 'inline' | 'reply' {
  return data.keyboardType === 'reply' ? 'reply' : 'inline';
}

/**
 * Проверяет, нужно ли выносить кнопки message-ноды в отдельную keyboard-ноду:
 * непустой массив buttons И keyboardType ∈ {inline, reply} (не 'none').
 * @param data - Данные message-ноды
 * @returns true, если кнопки подлежат выносу
 */
function shouldHoist(data: Record<string, unknown>): boolean {
  const hasButtons = Array.isArray(data.buttons) && data.buttons.length > 0;
  const kbType = data.keyboardType;
  const isHoistableType = kbType === 'inline' || kbType === 'reply';
  return hasButtons && isHoistableType;
}

/**
 * Выносит встроенные инлайн/reply-кнопки message-нод в отдельные keyboard-ноды.
 *
 * Правила (идемпотентно):
 * - обрабатываются только message-ноды с непустыми buttons и keyboardType ∈ {inline, reply};
 * - если у ноды уже есть привязанная keyboard-нода (по keyboardNodeId и нода существует) — пропуск;
 * - если keyboardNodeId указан, но keyboard-ноды нет — переиспользуем этот id;
 * - keyboard-нода создаётся со смещением +360 по x; в неё переносятся buttons/keyboardType
 *   и прочие keyboard-поля (TRANSFERRED_KEYBOARD_KEYS);
 * - в message проставляется keyboardType:'none', buttons:[], keyboardNodeId:<id>, а
 *   перенесённые keyboard-поля удаляются.
 * @param nodes - Список нод листа
 * @returns Новый список нод с вынесенными keyboard-нодами
 */
export function hoistMessageKeyboards(nodes: Node[]): Node[] {
  const workingNodes = nodes.map((node) => ({
    ...node,
    data: { ...(node.data as Record<string, unknown>) },
  })) as Node[];
  const appendedNodes: Node[] = [];

  for (let index = 0; index < workingNodes.length; index += 1) {
    const node = workingNodes[index];
    if (node.type !== 'message') continue;

    const nodeData = node.data as Record<string, unknown>;
    if (!shouldHoist(nodeData)) continue;

    const existingKeyboardNodeId = getKeyboardNodeId(nodeData);
    if (hasLinkedKeyboard([...workingNodes, ...appendedNodes], existingKeyboardNodeId)) {
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

    const nextMessageData: Record<string, unknown> = { ...nodeData, keyboardNodeId };
    for (const key of TRANSFERRED_KEYBOARD_KEYS) {
      delete nextMessageData[key];
    }
    nextMessageData.keyboardType = 'none';
    nextMessageData.buttons = [];

    workingNodes[index] = {
      ...node,
      data: nextMessageData as Node['data'],
    };
    appendedNodes.push(keyboardNode);
  }

  return [...workingNodes, ...appendedNodes];
}
