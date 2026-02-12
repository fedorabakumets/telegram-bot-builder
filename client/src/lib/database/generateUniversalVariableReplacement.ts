/**
 * @fileoverview Утилита для генерации кода универсальной замены переменных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего универсальную замены переменных в тексте.
 *
 * @module generateUniversalVariableReplacement
 */

import { generateUniversalVariableReplacement as generateInitVars } from '../utils';
import { replace_variables_in_text } from './replace_variables_in_text';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для универсальной замены переменных в тексте
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 * @param {string} indentLevel - уровень отступа для генерируемого кода
 */
export function generateUniversalVariableReplacement(codeLines: string[], indentLevel: string = '') {
  const universalVarCodeLines: string[] = [];

  // Используем утилиту для генерации кода инициализации переменных
  // Примечание: generateInitVars - это функция из ../utils, которая не была изменена
  // для использования массива строк, поэтому мы добавляем её результат напрямую
  const initVarsCode = generateInitVars(indentLevel);
  if (initVarsCode) {
    universalVarCodeLines.push(initVarsCode);
    universalVarCodeLines.push(`${indentLevel}`);
  }

  // Добавляем функцию замены переменных
  universalVarCodeLines.push(`${indentLevel}# Заменяем все переменные в тексте`);
  universalVarCodeLines.push(`${indentLevel}import re`);
  
  // Вызываем replace_variables_in_text с новой сигнатурой
  replace_variables_in_text(universalVarCodeLines, indentLevel);
  
  universalVarCodeLines.push(`${indentLevel}text = replace_variables_in_text(text, all_user_vars)`);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(universalVarCodeLines, 'generateUniversalVariableReplacement.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}
