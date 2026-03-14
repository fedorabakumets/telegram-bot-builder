/**
 * @fileoverview Ad-hoc обработчик пользовательского ввода
 * Функция генерации кода для обработки дополнительного сбора ответов
 */

import { generateSaveToDatabaseTable } from '../database/generateSaveToDatabaseTable';

/**
 * Генерирует код ad-hoc обработчика для сбора пользовательского ввода
 * @returns {string} Python код обработчика
 */
export const generateAdHocInputCollectionHandler = (): string => {
  let code = '        \n';
  code += '        # Если узел не найден\n';
  code += '        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")\n';
  code += '        del user_data[user_id]["waiting_for_input"]\n';
  code += '        return\n';
  code += '    \n';
  code += '    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок\n';
  code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
  code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
  code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
  code += '        input_target_node_id = user_data[user_id].get("input_target_node_id")\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Если есть целевой узел для перехода - это основной ввод, а не дополнительный\n';
  code += '        if input_target_node_id:\n';
  code += '            # Это основной ввод с переходом к следующему узлу\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][input_variable] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных (в соответствующую таблицу или user_data)\n';
  const saveCode = generateSaveToDatabaseTable({
    variableName: 'input_variable',
    valueExpression: 'response_data',
    indent: '            ',
    isVariableNameDynamic: true
  });
  code += saveCode;
  code += '            \n';
  code += '            logging.info(f"Получен основной пользовательский ввод: {input_variable} = {user_text}")\n';
  code += '            \n';
  code += '            # Переходим к целевому узлу\n';
  code += '            # Очищаем состояние сбора ввода\n';
  code += '            del user_data[user_id]["input_collection_enabled"]\n';
  code += '            if "input_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_node_id"]\n';
  code += '            if "input_variable" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_variable"]\n';
  code += '            if "input_target_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_target_node_id"]\n';
  code += '            \n';
  code += '            # Находим и вызываем обработчик целевого узла\n';

  return code;
};
