/**
 * @fileoverview Минимизация data нод — убирает поля со значениями по умолчанию
 * @module lib/bot-tools/minimize-node-data
 */

import type { Node } from '@shared/schema';
import { needsMessageDefaults } from './needs-message-defaults.ts';

/** Мусорные поля сообщения у нод без контента */
const MESSAGE_JUNK_KEYS = [
  'messageText', 'buttons', 'keyboardType', 'markdown', 'formatMode',
  'oneTimeKeyboard', 'resizeKeyboard', 'isPrivateOnly', 'adminOnly',
  'requiresAuth', 'showInMenu', 'enableStatistics', 'saveMessageIdTo',
] as const;

/**
 * Удаляет ключ, если значение совпадает с дефолтом
 * @param data - Объект data
 * @param key - Ключ
 * @param defaultValue - Значение по умолчанию
 */
function dropIfDefault(data: Record<string, unknown>, key: string, defaultValue: unknown): void {
  if (key in data && data[key] === defaultValue) {
    delete data[key];
  }
}

/**
 * Удаляет пустые строки и пустые массивы
 * @param data - Объект data
 * @returns Очищенный объект
 */
function trimEmpty(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      delete result[key];
    }
  }
  return result;
}

/**
 * Минимизирует data message-подобных нод (убирает дефолты клавиатуры и форматирования)
 * @param data - Исходный data
 * @returns Урезанный data
 */
function minimizeMessageLikeData(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  dropIfDefault(result, 'keyboardType', 'none');
  dropIfDefault(result, 'markdown', false);
  dropIfDefault(result, 'formatMode', 'none');
  dropIfDefault(result, 'resizeKeyboard', true);
  dropIfDefault(result, 'oneTimeKeyboard', false);
  dropIfDefault(result, 'isPrivateOnly', false);
  dropIfDefault(result, 'adminOnly', false);
  dropIfDefault(result, 'requiresAuth', false);
  dropIfDefault(result, 'showInMenu', true);
  dropIfDefault(result, 'enableStatistics', false);
  if (Array.isArray(result.buttons) && result.buttons.length === 0) {
    delete result.buttons;
  }
  if (!result.enableAutoTransition) {
    dropIfDefault(result, 'enableAutoTransition', false);
  }
  return trimEmpty(result);
}

/**
 * Минимизирует data триггеров
 * @param data - Исходный data
 * @returns Урезанный data
 */
function minimizeTriggerData(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  dropIfDefault(result, 'isPrivateOnly', false);
  dropIfDefault(result, 'adminOnly', false);
  dropIfDefault(result, 'requiresAuth', false);
  if (!result.autoTransitionTo) {
    dropIfDefault(result, 'enableAutoTransition', false);
    dropIfDefault(result, 'autoTransitionTo', '');
    dropIfDefault(result, 'sourceNodeId', '');
  }
  return trimEmpty(result);
}

/**
 * Убирает из data поля со значениями по умолчанию (для компактного JSON из MCP)
 * @param type - Тип ноды
 * @param data - Исходный data
 * @returns Минимальный валидный data
 */
export function minimizeNodeData(type: string, data: Record<string, unknown>): Record<string, unknown> {
  if (!needsMessageDefaults(type)) {
    const result = { ...data };
    for (const key of MESSAGE_JUNK_KEYS) {
      if (key in result) delete result[key];
    }
    if (type === 'command_trigger' || type === 'text_trigger' || type.endsWith('_trigger')) {
      return minimizeTriggerData(result);
    }
    return trimEmpty(result);
  }
  return minimizeMessageLikeData(data);
}

/**
 * Минимизирует data у ноды
 * @param node - Нода
 * @returns Нода с урезанным data
 */
export function minimizeNode(node: Node): Node {
  return {
    ...node,
    data: minimizeNodeData(node.type, node.data as Record<string, unknown>) as Node['data'],
  };
}
