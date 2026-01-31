/**
 * Генерирует Python-код для настройки ожидания пользовательского ввода
 * @param inputType - тип ввода (text, photo, video, audio, document)
 * @param inputVariable - переменная для сохранения введенных данных
 * @param inputValidation - тип валидации
 * @param minLength - минимальная длина ввода
 * @param maxLength - максимальная длина ввода
 * @param inputTimeout - таймаут ожидания ввода
 * @param inputRequired - обязательно ли вводить данные
 * @param allowSkip - разрешить пропуск ввода
 * @param saveToDatabase - сохранить в базу данных
 * @param inputRetryMessage - сообщение при повторной попытке
 * @param inputSuccessMessage - сообщение об успешном вводе
 * @param inputPrompt - приглашение к вводу
 * @param nodeId - ID текущего узла
 * @param nextNodeId - ID следующего узла
 * @returns Строку с Python-кодом для настройки ожидания ввода
 */
export function generateInputCollectionCode(
  inputType: string,
  inputVariable: string,
  inputValidation: string,
  minLength: number,
  maxLength: number,
  inputTimeout: number,
  inputRequired: boolean,
  allowSkip: boolean,
  saveToDatabase: boolean,
  inputRetryMessage: string,
  inputSuccessMessage: string,
  inputPrompt: string,
  nodeId: string,
  nextNodeId: string | null
): string {
  let code = '';
  code += '    # Настраиваем ожидание ввода (collectUserInput=true)\n';
  code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
  code += `        "type": "${inputType}",\n`;
  code += `        "variable": "${inputVariable}",\n`;
  code += `        "validation": "${inputValidation}",\n`;
  code += `        "min_length": ${minLength},\n`;
  code += `        "max_length": ${maxLength},\n`;
  code += `        "timeout": ${inputTimeout},\n`;
  code += `        "required": ${toPythonBoolean(inputRequired)},\n`;
  code += `        "allow_skip": ${toPythonBoolean(allowSkip)},\n`;
  code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
  code += `        "retry_message": "${escapeForJsonString(inputRetryMessage)}",\n`;
  code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
  code += `        "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
  code += `        "node_id": "${nodeId}",\n`;
  code += `        "next_node_id": "${nextNodeId || ''}"\n`;
  code += '    }\n';
  
  return code;
}

/**
 * Генерирует Python-код для случая, когда collectUserInput=false
 * @param nodeId - ID текущего узла
 * @returns Строку с Python-кодом комментария
 */
export function generateNoInputCollectionCode(nodeId: string): string {
  return `    # Узел ${nodeId} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
}

// Вспомогательные функции, которые используются в оригинальном коде
function toPythonBoolean(value: boolean): string {
  return value ? 'True' : 'False';
}

function escapeForJsonString(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/[\\]/g, '\\\\')
    .replace(/["]/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}