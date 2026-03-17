/**
 * @fileoverview Renderer для шаблона обработки reply-ввода
 * @module templates/reply-input-handler/reply-input-handler.renderer
 */

import type { ReplyInputHandlerTemplateParams, GraphNode, CommandNode } from './reply-input-handler.params';
import { replyInputHandlerParamsSchema } from './reply-input-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код блоков обработки reply-ввода внутри handle_user_input.
 *
 * Включает:
 * - button_response_config (reply-клавиатура с вариантами ответа)
 * - pending_skip_buttons (кнопки пропуска медиа-узлов)
 * - skip_buttons в waiting_for_input
 * - сохранение ответа с appendVariable
 * - цикл автопереходов + goto-навигация
 * - функцию call_skip_target_handler
 */
export function generateReplyInputHandler(params: ReplyInputHandlerTemplateParams): string {
  const validated = replyInputHandlerParamsSchema.parse(params);
  return renderPartialTemplate('reply-input-handler/reply-input-handler.py.jinja2', validated);
}

/**
 * Собирает GraphNode[] из массива узлов графа
 */
export function collectGraphNodes(nodes: any[]): GraphNode[] {
  return (nodes || [])
    .filter(n => n != null && n.id)
    .map(n => ({
      id: n.id,
      safeName: n.id.replace(/[^a-zA-Z0-9_]/g, '_'),
    }));
}

/**
 * Собирает CommandNode[] из массива узлов графа
 */
export function collectCommandNodes(nodes: any[]): CommandNode[] {
  return (nodes || [])
    .filter(n => n != null && n.data?.command && (n.type === 'start' || n.type === 'command'))
    .map(n => ({
      id: n.id,
      type: n.type,
      command: n.data.command,
    }));
}
