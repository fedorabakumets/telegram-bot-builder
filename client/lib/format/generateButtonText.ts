/**
 * @fileoverview Утилита для генерации текста кнопки с поддержкой переменных
 * 
 * Этот модуль предоставляет функции для безопасного форматирования
 * текста кнопок с поддержкой замены переменных перед встраиванием в Python код.
 * 
 * @module generateButtonText
 */

import { escapeForPython } from "./escapeForPython";

/**
 * Генерирует текст кнопки с поддержкой переменных.
 * 
 * Функция проверяет наличие переменных в тексте кнопки (в формате {переменная})
 * и возвращает соответствующий Python-код:
 * - Если переменные есть, оборачивает текст в вызов replace_variables_in_text
 * - Если переменных нет, возвращает простую строку с экранированием
 * 
 * @param buttonText - Текст кнопки для форматирования
 * @returns Отформатированный текст кнопки для использования в Python коде
 * 
 * @example
 * // Текст без переменных
 * const text = generateButtonText("Нажми меня");
 * // Возвращает: ""Нажми меня""
 * 
 * @example
 * // Текст с переменными
 * const text = generateButtonText("Привет, {user_name}!");
 * // Возвращает: "replace_variables_in_text(\"Привет, {user_name}!\", user_vars)"
 */
export function generateButtonText(buttonText: string): string {
  // Проверяем, есть ли в тексте переменные (паттерн {переменная})
  if (buttonText.includes('{') && buttonText.includes('}')) {
    // Экранируем текст для Python и оборачиваем в replace_variables_in_text
    const escapedText = escapeForPython(buttonText);
    return `replace_variables_in_text("${escapedText}", user_vars)`;
  } else {
    // Обычный текст без переменных
    return `"${escapeForPython(buttonText)}"`;
  }
}
