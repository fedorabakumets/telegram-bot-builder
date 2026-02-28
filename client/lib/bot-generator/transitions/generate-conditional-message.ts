/**
 * @fileoverview Генерация обработки условных сообщений
 *
 * Модуль создаёт Python-код для обработки условных сообщений
 * с проверкой переменных пользователя и генерацией клавиатур.
 *
 * @module bot-generator/transitions/generate-conditional-message
 */

import type { Button } from '../../bot-generator';
import { formatTextForPython, generateButtonText, stripHtmlTags, toPythonBoolean } from '../format';
import type { ConditionalMessageParams as BaseConditionalMessageParams } from './types/conditional-message-params';
import type { TransitionNode } from './types/transition-node';

/**
 * Параметры условного сообщения
 */
export interface ConditionalMessageParams {
  /** Условие с сообщением */
  condition: BaseConditionalMessageParams & {
    /** Тип клавиатуры */
    keyboardType?: 'inline' | 'reply' | 'none';
    /** Одноразовая клавиатура */
    oneTimeKeyboard?: boolean;
    /** Кнопки условия */
    buttons?: Button[];
    /** Следующий узел после ввода */
    nextNodeAfterInput?: string;
    /** Переменная текстового ввода */
    textInputVariable?: string;
  };
  /** Индекс условия в массиве */
  index: number;
  /** Родительский узел */
  navTargetNode: TransitionNode;
  /** ID узла для ввода */
  inputTargetNodeId: string;
}

/**
 * Генерирует код обработки одного условного сообщения
 *
 * @param params - Параметры условного сообщения
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateConditionalMessage(
  params: ConditionalMessageParams,
  indent: string
): string {
  const { condition, index, navTargetNode, inputTargetNodeId } = params;
  const cleanedConditionText = stripHtmlTags(condition.messageText);
  const conditionText = formatTextForPython(cleanedConditionText);
  const conditionKeyword = index === 0 ? 'if' : 'elif';

  let code = '';

  // Получаем имена переменных
  const variableNames = condition.variableNames && condition.variableNames.length > 0
    ? condition.variableNames
    : (condition.variableName ? [condition.variableName] : []);

  const logicOperator = condition.logicOperator || 'AND';

  code += `${indent}# Условие ${index + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;

  if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
    // Создаем единый блок условия с проверками ВНУТРИ
    code += `${indent}${conditionKeyword} (\n`;
    for (let j = 0; j < variableNames.length; j++) {
      const varName = variableNames[j];
      const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
      code += `${indent}    check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
    }
    code += `${indent}):\n`;

    // Собираем значения переменных
    code += `${indent}    # Собираем значения переменных\n`;
    for (const varName of variableNames) {
      code += `${indent}    _, variable_values["${varName}"] = check_user_variable_inline("${varName}", user_data_dict)\n`;
    }

    code += `${indent}    text = ${conditionText}\n`;

    // Заменяем переменные в тексте
    for (const varName of variableNames) {
      code += `${indent}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
      code += `${indent}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
    }

    // Генерируем клавиатуру
    const shouldGenerateKeyboard = navTargetNode.data.keyboardType !== 'none' &&
      condition.keyboardType &&
      condition.keyboardType !== 'none' &&
      condition.buttons &&
      condition.buttons.length > 0;

    if (shouldGenerateKeyboard) {
      code += `${indent}    # Создаем клавиатуру для условного сообщения\n`;
      code += generateConditionalKeyboard(condition, indent + '    ');
    } else {
      code += `${indent}    # Заменяем все переменные в тексте\n`;
      code += `${indent}    text = replace_variables_in_text(text, user_data_dict)\n`;
      code += `${indent}    await bot.send_message(user_id, text)\n`;
    }

    // Настраиваем ожидание ввода
    if (condition.waitForTextInput) {
      code += generateConditionalInputWaiting(
        condition,
        navTargetNode,
        inputTargetNodeId,
        `${indent}    `
      );
    }
  }

  return code;
}

/**
 * Генерирует код клавиатуры для условного сообщения
 *
 * @param condition - Условие с сообщением
 * @param innerIndent - Внутренний отступ
 * @returns Сгенерированный Python-код
 */
function generateConditionalKeyboard(
  condition: ConditionalMessageParams['condition'],
  innerIndent: string
): string {
  let code = '';

  if (condition.keyboardType === 'inline') {
    code += `${innerIndent}builder = InlineKeyboardBuilder()\n`;
    condition.buttons?.forEach((button: Button) => {
      if (button.action === 'url') {
        code += `${innerIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `${innerIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        code += `${innerIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
      } else {
        const callbackData = button.target || button.id || 'no_action';
        code += `${innerIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    });
    code += `${innerIndent}conditional_keyboard = builder.as_markup()\n`;
    code += `${innerIndent}# Заменяем все переменные в тексте\n`;
    code += `${innerIndent}text = replace_variables_in_text(text, user_data_dict)\n`;
    code += `${innerIndent}await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n`;
  } else if (condition.keyboardType === 'reply') {
    code += `${innerIndent}builder = ReplyKeyboardBuilder()\n`;
    condition.buttons?.forEach((button: Button) => {
      if (button.action === 'contact' && button.requestContact) {
        code += `${innerIndent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
      } else if (button.action === 'location' && button.requestLocation) {
        code += `${innerIndent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
      } else {
        code += `${innerIndent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
      }
    });
    const conditionOneTimeKeyboard = toPythonBoolean(condition.oneTimeKeyboard === true);
    code += `${innerIndent}conditional_keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard})\n`;
    code += `${innerIndent}await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n`;
  }

  return code;
}

/**
 * Генерирует код ожидания ввода для условного сообщения
 *
 * @param condition - Условие с сообщением
 * @param navTargetNode - Родительский узел
 * @param inputTargetNodeId - ID узла для ввода
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
function generateConditionalInputWaiting(
  condition: ConditionalMessageParams['condition'],
  navTargetNode: TransitionNode,
  inputTargetNodeId: string,
  indent: string
): string {
  const conditionalInputVariable = condition.textInputVariable ||
    navTargetNode.data.inputVariable ||
    `response_${navTargetNode.id}`;

  let code = '';
  code += `${indent}# Настраиваем ожидание текстового ввода для условного сообщения\n`;
  code += `${indent}user_data[user_id]["waiting_for_input"] = {\n`;
  code += `${indent}    "type": "text",\n`;
  code += `${indent}    "variable": "${conditionalInputVariable}",\n`;
  code += `${indent}    "save_to_database": True,\n`;
  code += `${indent}    "node_id": "${navTargetNode.id}",\n`;
  code += `${indent}    "next_node_id": "${condition.nextNodeAfterInput || inputTargetNodeId}"\n`;
  code += `${indent}}\n`;
  code += `${indent}logging.info(f"🔧 Настроено условное ожидание ввода для переменной: ${conditionalInputVariable} (узел ${navTargetNode.id})")\n`;

  return code;
}
