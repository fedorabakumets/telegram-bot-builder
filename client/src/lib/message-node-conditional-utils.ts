import { generateConditionalMessageLogic } from './Conditional';

/**
 * Генерирует Python-код для обработки условных сообщений в message узле
 * @param conditionalMessages - массив условных сообщений
 * @param formattedText - отформатированный текст основного сообщения
 * @param indent - отступ для кода
 * @returns Строку с Python-кодом для обработки условных сообщений
 */
export function generateMessageNodeConditionalMessageCode(
  conditionalMessages: any[],
  formattedText: string,
  indent: string = '    '
): string {
  let code = '';

  if (conditionalMessages && conditionalMessages.length > 0) {
    code += `${indent}\n`;
    code += `${indent}# Проверка условных сообщений\n`;
    code += `${indent}conditional_parse_mode = None\n`;
    code += `${indent}conditional_keyboard = None\n`;
    code += `${indent}user_record = await get_user_from_db(user_id)\n`;
    code += `${indent}if not user_record:\n`;
    code += `${indent}    user_record = user_data.get(user_id, {})\n`;
    code += `${indent}user_data_dict = user_record if user_record else user_data.get(user_id, {})\n`;
    code += generateConditionalMessageLogic(conditionalMessages, indent);
    code += `${indent}\n`;

    // Используем условное сообщение, если доступно, иначе используем стандартное
    code += `${indent}# Используем условное сообщение если есть подходящее условие\n`;
    code += `${indent}if "text" not in locals():\n`;
    code += `${indent}    text = ${formattedText}\n`;
    code += `${indent}\n`;
    code += `${indent}# Используем условную клавиатуру если есть\n`;
    code += `${indent}# Инициализируем переменную conditional_keyboard, если она не была определена\n`;
    code += `${indent}if "conditional_keyboard" not in locals():\n`;
    code += `${indent}    conditional_keyboard = None\n`;
    code += `${indent}if conditional_keyboard is not None:\n`;
    code += `${indent}    keyboard = conditional_keyboard\n`;
    code += `${indent}else:\n`;
    code += `${indent}    keyboard = None\n`;
  } else {
    code += `${indent}\n`;
    code += `${indent}# Без условных сообщений - используем обычную клавиатуру\n`;
    code += `${indent}keyboard = None\n`;
  }

  return code;
}