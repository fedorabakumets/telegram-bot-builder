/**
 * @fileoverview Функции рендеринга шаблона обработчиков узла edit_message
 * @module templates/edit-message/edit-message.renderer
 */

import type { Node } from '@shared/schema';
import type { EditMessageEntry, EditMessageTemplateParams } from './edit-message.params';
import { editMessageParamsSchema } from './edit-message.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает EditMessageEntry[] из массива узлов графа.
 * Находит все узлы с type === 'edit_message'.
 * Узлы без autoTransitionTo не пропускаются — edit_message может быть конечным.
 *
 * @param nodes - Массив узлов холста
 * @returns Массив EditMessageEntry для генерации обработчиков
 */
export function collectEditMessageEntries(nodes: Node[]): EditMessageEntry[] {
  const validNodes = nodes.filter(n => n != null);
  const nodeMap = new Map(validNodes.map(n => [n.id, n]));
  const entries: EditMessageEntry[] = [];

  for (const node of validNodes) {
    if (node.type !== 'edit_message') continue;

    const targetNodeId: string = (node.data as any)?.autoTransitionTo ?? '';
    const targetNode = nodeMap.get(targetNodeId);
    const targetNodeType = targetNode?.type ?? 'message';

    // Поддерживаем оба имени поля: editKeyboardNodeId (новое) и keyboardNodeId (legacy)
    const editKeyboardNodeId: string =
      (node.data as any)?.editKeyboardNodeId ||
      (node.data as any)?.keyboardNodeId ||
      '';

    // Находим keyboard-узел и извлекаем его кнопки
    const kbNode = editKeyboardNodeId ? nodeMap.get(editKeyboardNodeId) : undefined;
    const keyboardButtons = kbNode ? ((kbNode.data as any)?.buttons ?? []) : [];
    const keyboardEnableDynamicButtons = kbNode ? !!((kbNode.data as any)?.enableDynamicButtons) : false;
    const rawDynamic = kbNode ? ((kbNode.data as any)?.dynamicButtons ?? null) : null;
    const keyboardDynamicButtons = (keyboardEnableDynamicButtons && rawDynamic) ? {
      sourceVariable: rawDynamic.sourceVariable ?? '',
      arrayPath: rawDynamic.arrayPath ?? '',
      textTemplate: rawDynamic.textTemplate ?? '',
      callbackTemplate: rawDynamic.callbackTemplate ?? '',
      columns: rawDynamic.columns ?? 2,
    } : null;

    entries.push({
      nodeId: node.id,
      targetNodeId,
      targetNodeType,
      editMode: (node.data as any)?.editMode ?? 'text',
      editMessageText: (node.data as any)?.editMessageText ?? '',
      editFormatMode: (node.data as any)?.editFormatMode ?? 'none',
      editMessageIdSource: (node.data as any)?.editMessageIdSource ?? 'last_bot_message',
      editMessageIdManual: (node.data as any)?.editMessageIdManual ?? '',
      editKeyboardMode: (node.data as any)?.editKeyboardMode ?? 'keep',
      editKeyboardNodeId,
      keyboardButtons,
      keyboardEnableDynamicButtons,
      keyboardDynamicButtons,
    });
  }

  return entries;
}

/**
 * Генерация Python обработчиков узла edit_message из параметров (низкоуровневый API).
 *
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python код
 */
export function generateEditMessage(params: EditMessageTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = editMessageParamsSchema.parse(params);
  return renderPartialTemplate('edit-message/edit-message.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python обработчиков узла edit_message из массива узлов (высокоуровневый API).
 *
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python код
 */
export function generateEditMessageHandlers(nodes: Node[]): string {
  const entries = collectEditMessageEntries(nodes);
  if (entries.length === 0) return '';
  return generateEditMessage({ entries });
}
