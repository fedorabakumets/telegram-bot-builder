/**
 * @fileoverview Обработка автопереходов между узлами
 *
 * Генерирует Python-код для автоматического перехода от одного узла
 * к другому без участия пользователя (после выполнения условий).
 *
 * @module handle-auto-transition
 */

import type { Node } from '@shared/schema';

/**
 * Генерирует код для обработки автоперехода к целевому узлу
 * @param targetNode - Узел с настройками автоперехода
 * @param bodyIndent - Отступ для тела блока кода
 * @returns Строка с Python-кодом для автоперехода
 *
 * @example
 * const code = handleAutoTransition(nodeWithAutoTransition, '    ');
 */
export function handleAutoTransition(
  targetNode: Node,
  bodyIndent: string
): string {
  let code = '';

  const autoTargetId = targetNode.data?.autoTransitionTo || '';
  const autoSafeFunctionName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');

  code += `${bodyIndent}\n`;
  code += `${bodyIndent}# ⚡ Автопереход к узлу ${autoTargetId}\n`;
  code += `${bodyIndent}logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
  code += `${bodyIndent}import types as aiogram_types\n`;
  code += `${bodyIndent}async def noop(*args, **kwargs):\n`;
  code += `${bodyIndent}    return None\n`;
  code += `${bodyIndent}fake_message = aiogram_types.SimpleNamespace(\n`;
  code += `${bodyIndent}    chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
  code += `${bodyIndent}    message_id=message.message_id,\n`;
  code += `${bodyIndent}    delete=noop,\n`;
  code += `${bodyIndent}    edit_text=noop,\n`;
  code += `${bodyIndent}    answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)\n`;
  code += `${bodyIndent})\n`;
  code += `${bodyIndent}fake_callback = aiogram_types.SimpleNamespace(\n`;
  code += `${bodyIndent}    id="auto_transition",\n`;
  code += `${bodyIndent}    from_user=message.from_user,\n`;
  code += `${bodyIndent}    chat_instance="",\n`;
  code += `${bodyIndent}    data="${autoTargetId}",\n`;
  code += `${bodyIndent}    message=fake_message,\n`;
  code += `${bodyIndent}    answer=noop\n`;
  code += `${bodyIndent})\n`;
  code += `${bodyIndent}await handle_callback_${autoSafeFunctionName}(fake_callback)\n`;

  return code;
}

/**
 * Проверяет, можно ли выполнить автопереход для узла
 * @param targetNode - Узел для проверки
 * @returns true если автопереход можно выполнить
 *
 * Логика проверки:
 * - enableAutoTransition === true И autoTransitionTo существует → автопереход
 * - collectUserInput === false И enableAutoTransition === true → тоже автопереход (узлы без сбора ввода)
 * - collectUserInput === true → ждём ввода, потом переход по inputTargetNodeId/autoTransitionTo
 */
export function canAutoTransition(targetNode: Node): boolean {
  // Если явно включен автопереход и указана цель → выполняем автопереход
  if (targetNode.data?.enableAutoTransition === true && !!targetNode.data?.autoTransitionTo) {
    return true;
  }
  return false;
}
