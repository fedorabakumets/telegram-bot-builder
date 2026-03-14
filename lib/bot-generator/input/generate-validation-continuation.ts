/**
 * @fileoverview Валидация и продолжение пользовательского ввода
 * Функция генерации кода валидации и сохранения данных пользователя
 */

import { generateSaveToDatabaseTable } from '../database/generateSaveToDatabaseTable';

/**
 * Генерирует код валидации пользовательского ввода и логики продолжения
 * @returns {string} Python код валидации и сохранения
 */
export const generateUserInputValidationAndContinuationLogic = (): string => {
  let code = '';

  code += '    # Валидация длины текста\n';
  code += '    min_length = input_config.get("min_length", 0)\n';
  code += '    max_length = input_config.get("max_length", 0)\n';
  code += '    \n';
  code += '    if min_length > 0 and len(user_text) < min_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if max_length > 0 and len(user_text) > max_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Валидация типа ввода\n';
  code += '    input_type = input_config.get("type", "text")\n';
  code += '    \n';
  code += '    if input_type == "email":\n';
  code += '        import re\n';
  code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '        if not re.match(email_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "number":\n';
  code += '        try:\n';
  code += '            float(user_text)\n';
  code += '        except ValueError:\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "phone":\n';
  code += '        import re\n';
  code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '        if not re.match(phone_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Сохраняем ответ пользователя простым значением\n';
  code += '    variable_name = input_config.get("variable", "user_response")\n';
  code += '    timestamp = get_moscow_time()\n';
  code += '    node_id = input_config.get("node_id", "unknown")\n';
  code += '    \n';
  code += '    # Простое значение вместо сложного объекта\n';
  code += '    response_data = user_text\n';
  code += '    \n';
  code += '    # Сохраняем в пользовательские данные\n';
  code += '    user_data[user_id][variable_name] = response_data\n';
  code += '    \n';
  code += '    # Сохраняем в базу данных если включено (в соответствующую таблицу или user_data)\n';
  code += '    if input_config.get("save_to_database"):\n';
  const saveCode = generateSaveToDatabaseTable({
    variableName: 'variable_name',
    valueExpression: 'response_data',
    indent: '        ',
    isVariableNameDynamic: true
  });
  code += saveCode;
  code += '    \n';
  code += '    # Отправляем сообщение об успехе только если оно задано\n';
  code += '    success_message = input_config.get("success_message", "")\n';
  code += '    if success_message:\n';
  code += '        await message.answer(success_message)\n';
  code += '    \n';
  code += '    # Очищаем состояние ожидания ввода\n';
  code += '    del user_data[user_id]["waiting_for_input"]\n';
  code += '    \n';
  code += '    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '    \n';
  code += '    # Автоматическая навигация к следующему узлу после успешного ввода\n';
  code += '    next_node_id = input_config.get("next_node_id")\n';
  code += '    logging.info(f"🔍 Проверяем навигацию: next_node_id = {next_node_id}")\n';
  code += '    if next_node_id:\n';
  code += '        try:\n';
  code += '            logging.info(f"🔄 Переходим к следующему узлу: {next_node_id}")\n';
  code += '            \n';
  code += '            # Создаем фейковое сообщение для навигации\n';
  code += '            fake_message = type("FakeMessage", (), {})()\n';
  code += '            fake_message.from_user = message.from_user\n';
  code += '            fake_message.answer = message.answer\n';
  code += '            fake_message.delete = lambda: None\n';
  code += '            \n';
  code += '            # Находим узел по ID и выполняем соответствующее действие\n';

  return code;
};
