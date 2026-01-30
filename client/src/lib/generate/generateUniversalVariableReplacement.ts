import { generateUniversalVariableReplacement as generateInitVars, generateReplaceVariablesFunction } from '../utils';

// Функция для генерации замены всех переменных в тексте (рефакторенная версия)
export function generateUniversalVariableReplacement(indentLevel: string): string {
  let code = '';

  // Используем утилиту для генерации кода инициализации переменных
  code += generateInitVars(indentLevel);
  code += `${indentLevel}\n`;

  // Добавляем функцию замены переменных
  code += `${indentLevel}# Заменяем все переменные в тексте\n`;
  code += `${indentLevel}import re\n`;
  code += generateReplaceVariablesFunction(indentLevel);
  code += `${indentLevel}text = replace_variables_in_text(text, user_vars)\n`;

  return code;
}
