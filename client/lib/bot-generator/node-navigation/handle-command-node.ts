/**
 * @fileoverview Обработка узлов-команд Telegram-бота
 *
 * Генерирует Python-код для вызова обработчиков команд (/start, /help и др.)
 * через создание fake_message объекта.
 *
 * @module handle-command-node
 */

import type { Node } from '@shared/schema';

/**
 * Генерирует код для обработки узла-команды
 * @param targetNode - Узел команды с настройками
 * @param bodyIndent - Отступ для тела блока кода
 * @returns Строка с Python-кодом для вызова обработчика команды
 *
 * @example
 * const code = handleCommandNode(commandNode, '    ');
 */
export function handleCommandNode(
  targetNode: Node,
  bodyIndent: string
): string {
  let code = '';

  const commandName = targetNode.data?.command?.replace('/', '') || 'unknown';
  const handlerName = `${commandName}_handler`;

  code += `${bodyIndent}# Выполняем команду ${targetNode.data?.command}\n`;
  code += `${bodyIndent}from types import SimpleNamespace\n`;
  code += `${bodyIndent}fake_message = SimpleNamespace()\n`;
  code += `${bodyIndent}fake_message.from_user = message.from_user\n`;
  code += `${bodyIndent}fake_message.chat = message.chat\n`;
  code += `${bodyIndent}fake_message.date = message.date\n`;
  code += `${bodyIndent}fake_message.answer = message.answer\n`;
  code += `${bodyIndent}await ${handlerName}(fake_message)\n`;
  code += `${bodyIndent}break  # Выходим из цикла после выполнения команды\n`;

  return code;
}
