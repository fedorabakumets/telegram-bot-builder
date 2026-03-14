/**
 * @fileoverview Обработка условных сообщений
 *
 * Генерирует Python-код для проверки условий и показа различных
 * вариантов сообщений в зависимости от данных пользователя.
 *
 * @module handle-conditional-messages
 */

import type { Node } from '@shared/schema';
import type { Button } from '../types/button-types';
import { generateButtonText } from '../format';
import { toPythonBoolean } from '../format';

/**
 * Интерфейс условного сообщения
 */
export interface ConditionalMessage {
  /** Условие для проверки */
  condition: string;
  /** Имя переменной для проверки */
  variableName?: string;
  /** Приоритет условия */
  priority?: number;
  /** Кнопки для условия */
  buttons?: Button[];
  /** Нужно ли собирать ввод */
  collectUserInput?: boolean;
  /** Переменная для ввода */
  inputVariable?: string;
  /** Целевой узел после ввода */
  nextNodeAfterInput?: string;
  /** Ждать ли текстовый ввод */
  waitForTextInput?: boolean;
  /** Включён ли текстовый ввод */
  enableTextInput?: boolean;
}

/**
 * Генерирует код для обработки условных сообщений
 * @param targetNode - Узел с настройками условных сообщений
 * @param bodyIndent - Отступ для тела блока кода
 * @returns Строка с Python-кодом для условных сообщений
 */
export function handleConditionalMessages(
  targetNode: Node,
  bodyIndent: string
): string {
  let code = '';

  code += `${bodyIndent}# Узел с условными сообщениями - проверяем условия\n`;
  code += `${bodyIndent}logging.info(f"🔧 Обработка узла с условными сообщениями: ${targetNode.id}")\n`;
  code += `${bodyIndent}user_data_dict = await get_user_from_db(user_id) or {}\n`;
  code += `${bodyIndent}user_data_dict.update(user_data.get(user_id, {}))\n`;
  code += `${bodyIndent}conditional_met = False\n`;

  // Сортировка условий по приоритету (убывание)
  const conditions = targetNode.data?.conditionalMessages || [];
  const sortedConditions = [...conditions].sort(
    (a: ConditionalMessage, b: ConditionalMessage) => (b.priority || 0) - (a.priority || 0)
  );

  sortedConditions.forEach((condition: ConditionalMessage, condIndex: number) => {
    code += generateConditionCheck(condition, condIndex, bodyIndent, targetNode.id);
  });

  return code;
}

/**
 * Генерирует проверку одного условия
 */
function generateConditionCheck(
  condition: ConditionalMessage,
  condIndex: number,
  bodyIndent: string,
  targetNodeId: string
): string {
  let code = '';
  const ifKeyword = condIndex === 0 ? 'if' : 'elif';

  if (condition.condition === 'user_data_exists' && condition.variableName) {
    code += `${bodyIndent}${ifKeyword} (\n`;
    code += `${bodyIndent}    check_user_variable_inline("${condition.variableName}", user_data_dict)[0]\n`;
    code += `${bodyIndent}):\n`;
    code += `${bodyIndent}    conditional_met = True\n`;

    if (condition.buttons && condition.buttons.length > 0) {
      code += generateConditionalKeyboard(condition, bodyIndent, targetNodeId);
    }
  }

  return code;
}

/**
 * Генерирует условную клавиатуру
 */
function generateConditionalKeyboard(
  condition: ConditionalMessage,
  bodyIndent: string,
  targetNodeId: string
): string {
  let code = '';

  code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;
  condition.buttons?.forEach((btn: Button) => {
    code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
  });

  const resizeKeyboard = toPythonBoolean(true);
  const oneTimeKeyboard = toPythonBoolean(false);
  code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
  code += `${bodyIndent}    main_text = text\n`;
  code += `${bodyIndent}    # Заменяем все переменные в тексте\n`;
  code += `${bodyIndent}    # Заменяем все переменные в тексте\n`;
  code += `${bodyIndent}    # Получаем фильтры переменных для замены\n`;
  code += `${bodyIndent}    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${bodyIndent}    main_text = replace_variables_in_text(main_text, user_data_dict, variable_filters)\n`;
  code += `${bodyIndent}    await message.answer(main_text, reply_markup=keyboard)\n`;

  // Проверка на сбор ввода
  const condCollectInput =
    condition.collectUserInput === true ||
    condition.waitForTextInput === true ||
    condition.enableTextInput === true;

  if (condCollectInput) {
    code += generateConditionalInputWait(condition, bodyIndent, targetNode);
  } else {
    code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура (сбор ответов НЕ настроен)")\n`;
  }

  return code;
}

/**
 * Генерирует ожидание ввода для условного сообщения
 */
function generateConditionalInputWait(
  condition: ConditionalMessage,
  bodyIndent: string,
  targetNode: Node
): string {
  let code = '';
  const condInputVariable = condition.inputVariable || condition.variableName || 'response';
  const nextNodeAfterCondition = condition.nextNodeAfterInput || '';

  code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура (сбор ответов НАСТРОЕН)")\n`;
  code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
  code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
  code += `${bodyIndent}        "type": "text",\n`;
  code += `${bodyIndent}        "variable": "${condInputVariable}",\n`;
  code += `${bodyIndent}        "save_to_database": True,\n`;
  code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
  code += `${bodyIndent}        "next_node_id": "${nextNodeAfterCondition}",\n`;
  code += `${bodyIndent}        "appendVariable": ${toPythonBoolean(targetNode.data.appendVariable || false)}\n`;
  code += `${bodyIndent}    }\n`;

  return code;
}
