/**
 * @fileoverview Генератор функции навигации к узлу
 *
 * Модуль создаёт Python-код для функции navigate_to_node,
 * которая устраняет дублирование кода навигации между обработчиками.
 *
 * Эта функция заменяет дублирующийся код в 4+ местах генератора ботов.
 *
 * @module bot-generator/transitions/generate-node-navigation
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код функции navigate_to_node
 *
 * @returns Строка с Python-кодом функции
 *
 * @example
 * // Генерация функции
 * const code = generateNavigateToNode();
 */
export function generateNavigateToNode(): string {
  const codeLines: string[] = [];

  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │    Навигация к узлу                     │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('async def navigate_to_node(message, node_id: str, text: str = None, all_user_vars: dict = None, reply_markup=None):');
  codeLines.push('    """Навигация к указанному узлу с отправкой сообщения');
  codeLines.push('    ');
  codeLines.push('    Args:');
  codeLines.push('        message: Объект сообщения от aiogram');
  codeLines.push('        node_id (str): ID целевого узла');
  codeLines.push('        text (str, optional): Текст сообщения (по умолчанию генерируется)');
  codeLines.push('        all_user_vars (dict, optional): Переменные пользователя');
  codeLines.push('        reply_markup: Клавиатура для сообщения (optional)');
  codeLines.push('        ');
  codeLines.push('    Returns:');
  codeLines.push('        None');
  codeLines.push('    """');
  codeLines.push('    user_id = message.from_user.id');
  codeLines.push('    ');
  codeLines.push('    # Инициализируем all_user_vars если не передан');
  codeLines.push('    if all_user_vars is None:');
  codeLines.push('        all_user_vars = await init_all_user_vars(user_id)');
  codeLines.push('    ');
  codeLines.push('    # Инициализируем текст если не передан');
  codeLines.push('    if text is None:');
  codeLines.push('        text = "Привет! Добро пожаловать!"');
  codeLines.push('    ');
  codeLines.push('    # Заменяем переменные в тексте');
  codeLines.push('    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})');
  codeLines.push('    text = replace_variables_in_text(text, all_user_vars, variable_filters)');
  codeLines.push('    ');
  codeLines.push('    # Отправляем сообщение');
  codeLines.push('    logging.info(f"🚀 Навигация к узлу: {node_id}")');
  codeLines.push('    if reply_markup:');
  codeLines.push('        await message.answer(text, reply_markup=reply_markup)');
  codeLines.push('    else:');
  codeLines.push('        await message.answer(text)');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(
    codeLines,
    'generate-node-navigation.ts'
  );

  return processedCode.join('\n');
}

/**
 * Генерирует вызов функции навигации
 *
 * @param nodeId - ID целевого узла
 * @param messageVar - Имя переменной сообщения (по умолчанию 'message')
 * @param indent - Отступ для кода (по умолчанию '')
 * @returns Строка с Python-кодом вызова
 */
export function generateNavigateToNodeCall(
  nodeId: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}")`;
}

/**
 * Генерирует вызов функции навигации с кастомным текстом
 *
 * @param nodeId - ID целевого узла
 * @param textVar - Имя переменной с текстом
 * @param messageVar - Имя переменной сообщения (по умолчанию 'message')
 * @param indent - Отступ для кода (по умолчанию '')
 * @returns Строка с Python-кодом вызова
 */
export function generateNavigateToNodeWithText(
  nodeId: string,
  textVar: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}", text=${textVar})`;
}

/**
 * Генерирует вызов функции навигации с кастомными переменными
 *
 * @param nodeId - ID целевого узла
 * @param userVarsVar - Имя переменной с пользовательскими данными
 * @param messageVar - Имя переменной сообщения (по умолчанию 'message')
 * @param indent - Отступ для кода (по умолчанию '')
 * @returns Строка с Python-кодом вызова
 */
export function generateNavigateToNodeWithVars(
  nodeId: string,
  userVarsVar: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}", all_user_vars=${userVarsVar})`;
}

/**
 * Генерирует безопасный вызов с проверкой существования обработчика
 * Используется для навигации через callback-обработчики
 *
 * @param nodeId - ID целевого узла
 * @param indent - Отступ для кода (по умолчанию '')
 * @param indentIn - Дополнительный отступ для внутреннего блока (по умолчанию '    ')
 * @returns Строка с Python-кодом безопасного вызова
 */
export function generateNavigateToNodeSafe(
  nodeId: string,
  indent: string = '',
  indentIn: string = '    '
): string {
  const safeFuncName = nodeId.replace(/-/g, '_').replace(/ /g, '_');
  const handlerFuncName = `handle_callback_${safeFuncName}`;

  const codeLines: string[] = [];

  codeLines.push(`${indent}if "${nodeId}" == "${nodeId}":`);
  codeLines.push(`${indent}${indentIn}if '${handlerFuncName}' in globals():`);
  codeLines.push(`${indent}${indentIn}${indentIn}await ${handlerFuncName}(fake_callback)`);
  codeLines.push(`${indent}${indentIn}else:`);
  codeLines.push(`${indent}${indentIn}${indentIn}logging.warning(f"⚠️ Обработчик не найден для узла: ${nodeId}")`);
  codeLines.push(`${indent}${indentIn}${indentIn}await message.answer("Переход завершен")`);
  codeLines.push('');

  return codeLines.join('\n');
}
