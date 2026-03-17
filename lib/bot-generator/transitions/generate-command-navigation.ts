/**
 * @fileoverview Генерация обработки навигации к команде
 *
 * Модуль создаёт Python-код для обработки навигации к узлам команд
 * через callback в inline клавиатурах.
 *
 * @module bot-generator/transitions/generate-command-navigation
 */

/**
 * Параметры навигации к команде
 */
export interface CommandNavigationParams {
  /** Целевой узел команды */
  navTargetNode: any;
}

/**
 * Генерирует код обработки навигации к узлу команды
 *
 * @param params - Параметры навигации к команде
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateCommandNavigation(
  params: CommandNavigationParams,
  indent: string
): string {
  const { navTargetNode } = params;
  const commandName = navTargetNode.data.command?.replace('/', '') || 'unknown';
  const handlerName = `${commandName}_handler`;

  let code = '';
  code += `${indent}# Выполняем команду ${navTargetNode.data.command}\n`;
  code += `${indent}fake_message = SimpleNamespace()\n`;
  code += `${indent}fake_message.from_user = callback_query.from_user\n`;
  code += `${indent}fake_message.chat = callback_query.message.chat\n`;
  code += `${indent}fake_message.date = callback_query.message.date\n`;
  code += `${indent}fake_message.answer = callback_query.message.answer\n`;
  code += `${indent}await ${handlerName}(fake_message)\n`;

  return code;
}
