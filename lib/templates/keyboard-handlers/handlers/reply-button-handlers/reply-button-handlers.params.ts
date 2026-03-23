/**
 * @fileoverview Параметры для шаблона reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.params
 */

import type { Node } from '@shared/schema';

/** Кнопка для reply клавиатуры */
export interface ReplyButton {
  id: string;
  text: string;
  action: string;
  target?: string;
}

/** Узел с reply клавиатурой */
export interface ReplyNode {
  id: string;
  type: string;
  data: {
    keyboardType: 'reply';
    buttons?: ReplyButton[];
    allowMultipleSelection?: boolean;
  };
}

/** Параметры для генерации обработчиков reply кнопок */
export interface ReplyButtonHandlersTemplateParams {
  /** Все узлы для генерации обработчиков */
  nodes: Node[];
  /** Уровень отступа */
  indentLevel?: string;
}
