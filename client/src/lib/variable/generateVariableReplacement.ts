// ============================================================================
// ГЕНЕРАТОРЫ ЗАМЕНЫ ПЕРЕМЕННЫХ
// ============================================================================
// Функция для генерации замены переменных в тексте
function generateVariableReplacement(variableName: string, indentLevel: string): string {
  let code = '';
  code += `${indentLevel}    # Подставляем значения переменных\n`;
  code += `${indentLevel}    if "{${variableName}}" in text:\n`;
  code += `${indentLevel}        if variable_value is not None:\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", str(variable_value))\n`;
  code += `${indentLevel}        else:\n`;
  code += `${indentLevel}            # Если переменная не найдена, отображаем как простой текст\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", "${variableName}")\n`;
  return code;
}
