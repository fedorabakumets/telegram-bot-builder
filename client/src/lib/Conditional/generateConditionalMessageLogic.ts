import { generateCheckUserVariableFunction } from "../database/generateCheckUserVariableFunction";
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { processConditionalMessages } from './processConditionalMessages';
import { hasComponentBeenGenerated, markComponentAsGenerated } from '../utils/generation-state';

/**
 * Генерирует Python код логики условных сообщений для Telegram бота.
 *
 * Эта функция создает комплексную Python логику для обработки условных сообщений,
 * которая включает в себя:
 *
 * Основные возможности:
 * - Создание функции проверки переменных пользователя (check_user_variable)
 * - Функцию замены переменных в тексте (replace_variables_in_text)
 * - Инициализацию пользовательских переменных и данных
 * - Поддержку различных типов условий:
 *   * user_data_exists - проверка существования переменных
 *   * user_data_not_exists - проверка отсутствия переменных
 *   * user_data_equals - проверка равенства значения переменной
 *   * user_data_contains - проверка содержания подстроки в переменной
 * - Поддержку множественных переменных с логическими операторами (AND/OR)
 * - Генерацию условных клавиатур для каждого условия
 * - Настройку ожидания текстового ввода для условных сообщений
 * - Поддержку кнопок с пропуском сбора данных (skipDataCollection)
 * - Логирование выполнения условий для отладки
 * - Обработку приоритетов условий (сортировка по убыванию приоритета)
 *
 * Функция создает if/elif структуру для последовательной проверки условий
 * и возвращает Python код, который интегрируется в обработчики команд.
 *
 * @param conditionalMessages - Массив условных сообщений для обработки
 * @param indentLevel - Уровень отступа для генерируемого Python кода (по умолчанию '    ')
 * @param nodeData - Дополнительные данные узла для контекста (опционально)
 * @returns Строку с Python кодом логики условных сообщений
 *
 * @example
 * const conditionalMessages = [
 *   {
 *     condition: "user_data_exists",
 *     variableNames: ["user_age"],
 *     messageText: "Добро пожаловать, {user_name}! Возраст: {user_age}",
 *     keyboardType: "inline",
 *     buttons: [
 *       { text: "Изменить возраст", action: "goto", target: "edit_age" }
 *     ],
 *     priority: 1
 *   },
 *   {
 *     condition: "user_data_not_exists",
 *     variableNames: ["user_age"],
 *     messageText: "Пожалуйста, укажите ваш возраст",
 *     waitForTextInput: true,
 *     textInputVariable: "user_age",
 *     priority: 2
 *   }
 * ];
 *
 * const logicCode = generateConditionalMessageLogic(conditionalMessages, '    ', nodeData);
 * // Генерирует Python код с проверками условий и соответствующими действиями
 */

// Функция для генерации логики условных сообщений
export function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string = '    ', nodeData?: any): string {
  if (!conditionalMessages || conditionalMessages.length === 0) {
    return '';
  }

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  const sortedConditions = [...conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // НЕ инициализируем conditional_parse_mode и conditional_keyboard здесь
  // Они должны быть инициализированы вызывающей функцией ПЕРЕД вызовом generateConditionalMessageLogic
  // Получаем user_vars для подстановки в кнопки условных сообщений
  codeLines.push(`${indentLevel}# Инициализируем базовые переменные пользователя если их нет`);
  codeLines.push(`${indentLevel}# Получаем объект пользователя из сообщения или callback`);
  codeLines.push(`${indentLevel}user_obj = None`);
  codeLines.push(`${indentLevel}# Безопасно проверяем наличие message (для message handlers)`);
  codeLines.push(`${indentLevel}if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):`);
  codeLines.push(`${indentLevel}    user_obj = locals().get('message').from_user`);
  codeLines.push(`${indentLevel}# Безопасно проверяем наличие callback_query (для callback handlers)`);
  codeLines.push(`${indentLevel}elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):`);
  codeLines.push(`${indentLevel}    user_obj = locals().get('callback_query').from_user`);
  codeLines.push(``);
  codeLines.push(`${indentLevel}if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):`);
  codeLines.push(`${indentLevel}    # Проверяем, что user_obj определен и инициализируем переменные пользователя`);
  codeLines.push(`${indentLevel}    if user_obj is not None:`);
  codeLines.push(`${indentLevel}        init_user_variables(user_id, user_obj)`);
  codeLines.push(`${indentLevel}`);
  codeLines.push(`${indentLevel}# Подставляем все доступные переменные пользователя в текст кнопок`);
  codeLines.push(`${indentLevel}user_vars = await get_user_from_db(user_id)`);
  codeLines.push(`${indentLevel}if not user_vars:`);
  codeLines.push(`${indentLevel}    user_vars = user_data.get(user_id, {})`);
  codeLines.push(`${indentLevel}`);
  codeLines.push(`${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data`);
  codeLines.push(`${indentLevel}if not isinstance(user_vars, dict):`);
  codeLines.push(`${indentLevel}    user_vars = {}`);
  codeLines.push(`${indentLevel}`);
  // Проверяем, была ли уже сгенерирована функция replace_variables_in_text
  if (!hasComponentBeenGenerated('replace_variables_in_text')) {
    codeLines.push(`${indentLevel}# Заменяем все переменные в тексте`);
    codeLines.push(`${indentLevel}import re`);
    codeLines.push(`${indentLevel}def replace_variables_in_text(text_content, variables_dict):`);
    codeLines.push(`${indentLevel}    if not text_content or not variables_dict:`);
    codeLines.push(`${indentLevel}        return text_content`);
    codeLines.push(`${indentLevel}    `);
    codeLines.push(`${indentLevel}    for var_name, var_data in variables_dict.items():`);
    codeLines.push(`${indentLevel}        placeholder = "{" + var_name + "}"`);
    codeLines.push(`${indentLevel}        if placeholder in text_content:`);
    codeLines.push(`${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:`);
    codeLines.push(`${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name`);
    codeLines.push(`${indentLevel}            elif var_data is not None:`);
    codeLines.push(`${indentLevel}                var_value = str(var_data)`);
    codeLines.push(`${indentLevel}            else:`);
    codeLines.push(`${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет`);
    codeLines.push(`${indentLevel}            text_content = text_content.replace(placeholder, var_value)`);
    codeLines.push(`${indentLevel}    return text_content`);
    codeLines.push(`${indentLevel}`);
    // Отмечаем, что функция была сгенерирована
    markComponentAsGenerated('replace_variables_in_text');
  }

  // Добавляем определение функции check_user_variable_inline
  const checkUserVariableCode = generateCheckUserVariableFunction(indentLevel);
  const checkUserVariableLines = checkUserVariableCode.split('\n').filter(line => line.trim());
  codeLines.push(...checkUserVariableLines);

  // Создаем единую if/elif/else структуру для всех условий
  const processedCode = processConditionalMessages(sortedConditions, nodeData, codeLines.join('\n'), indentLevel);

  // Разбиваем обработанный код обратно на строки для дальнейшей обработки
  const allCodeLines = processedCode.split('\n');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(allCodeLines, 'generateConditionalMessageLogic.ts');

  // НЕ добавляем else блок здесь - он будет добавлен основной функцией
  return commentedCodeLines.join('\n');
}

