/**
 * @fileoverview Тестовые данные для шаблона обработчиков узла edit_message
 * @module templates/edit-message/edit-message.fixture
 */

import type { EditMessageTemplateParams } from './edit-message.params';
import type { Node } from '@shared/schema';

/**
 * Создаёт минимальный узел для тестов
 * @param id - ID узла
 * @param type - Тип узла
 * @param data - Данные узла
 * @returns Объект узла
 */
export function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (EditMessageTemplateParams) ──────────────────────

/** Пустой массив узлов */
export const validParamsEmpty: EditMessageTemplateParams = {
  entries: [],
};

/** Один узел edit_message — редактирование текста */
export const validParamsSingle: EditMessageTemplateParams = {
  entries: [
    {
      nodeId: 'edit_1',
      targetNodeId: 'next_node',
      targetNodeType: 'message',
      editMode: 'text',
      editMessageText: 'Обновлённый текст',
      editFormatMode: 'html',
      editMessageIdSource: 'last_bot_message',
      editMessageIdManual: '',
      editKeyboardMode: 'keep',
      editKeyboardNodeId: '',
    },
  ],
};

/** Несколько узлов edit_message с разными режимами */
export const validParamsMultiple: EditMessageTemplateParams = {
  entries: [
    {
      nodeId: 'edit_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      editMode: 'text',
      editMessageText: 'Текст 1',
      editFormatMode: 'markdown',
      editMessageIdSource: 'last_bot_message',
      editMessageIdManual: '',
      editKeyboardMode: 'keep',
      editKeyboardNodeId: '',
    },
    {
      nodeId: 'edit_2',
      targetNodeId: '',
      targetNodeType: 'message',
      editMode: 'markup',
      editMessageText: '',
      editFormatMode: 'none',
      editMessageIdSource: 'custom',
      editMessageIdManual: '{msg_id}',
      editKeyboardMode: 'remove',
      editKeyboardNodeId: '',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) ────────────────────────────────────────

/** Один узел edit_message с autoTransitionTo */
export const nodesWithNode: Node[] = [
  makeNode('edit_1', 'edit_message', {
    autoTransitionTo: 'msg_1',
    editMode: 'text',
    editMessageText: 'Привет!',
    editFormatMode: 'html',
    editMessageIdSource: 'last_bot_message',
    editMessageIdManual: '',
    editKeyboardMode: 'keep',
    editKeyboardNodeId: '',
  }),
  makeNode('msg_1', 'message', { messageText: 'Следующий шаг' }),
];

/** Узлы без edit_message */
export const nodesWithoutNodes: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('edit_1', 'edit_message', {
    autoTransitionTo: 'msg_1',
    editMode: 'both',
    editMessageText: 'OK',
    editFormatMode: 'none',
    editMessageIdSource: 'last_bot_message',
    editMessageIdManual: '',
    editKeyboardMode: 'remove',
    editKeyboardNodeId: '',
  }),
  makeNode('msg_1', 'message', {}),
];
