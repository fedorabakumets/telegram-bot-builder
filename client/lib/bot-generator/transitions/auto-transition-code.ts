/**
 * @fileoverview Код автоперехода
 *
 * Модуль генерирует Python-код для выполнения автоперехода
 * к целевому узлу после обработки текущего.
 *
 * @module bot-generator/transitions/auto-transition-code
 */

import type { AutoTransitionCodeParams } from './types/auto-transition-code-params';

/**
 * Генерирует код выполнения автоперехода
 *
 * @param params - Параметры автоперехода
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCode(
  params: AutoTransitionCodeParams,
  indent: string = '    '
): string {
  const { autoTransitionTarget, nodeId, nodes } = params;

  let code = '';
  const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');

  // ИСПРАВЛЕНИЕ: Проверяем, что это не fake callback (для предотвращения дублирования)
  // Автопереход уже был выполнен в start_handler через FakeCallbackQuery
  code += `${indent}# Проверяем, что это не fake callback (для предотвращения дублирования сообщений)\n`;
  code += `${indent}if hasattr(callback_query, '_is_fake') and callback_query._is_fake:\n`;
  code += `${indent}    logging.debug(f"⚡ Fake callback: пропускаем повторный автопереход от {nodeId}")\n`;
  code += `${indent}else:\n`;

  // Логирование
  code += `${indent}    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTarget}")\n`;

  // Проверяем существование целевого узла
  const targetExists = nodes.some(n => n.id === autoTransitionTarget);

  if (targetExists) {
    code += `${indent}    await handle_callback_${safeFunctionName}(callback_query)\n`;
  } else {
    code += `${indent}    logging.warning(f"⚠️ Узел автоперехода не найден: {autoTransitionTarget}, завершаем переход")\n`;
    code += `${indent}    await callback_query.message.edit_text("Переход завершен")\n`;
  }

  // Завершение
  code += `${indent}    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTarget}")\n`;
  code += `${indent}    return\n`;

  return code;
}

/**
 * Генерирует код возврата из автоперехода
 *
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionReturn(indent: string = '    '): string {
  return `${indent}return\n`;
}
