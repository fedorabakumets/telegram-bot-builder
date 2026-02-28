/**
 * @fileoverview Утилита для получения параметра parse_mode для Telegram бота
 * 
 * Этот модуль предоставляет функции для преобразования формата сообщения
 * в соответствующий параметр parse_mode, используемый при отправке
 * сообщений через Telegram API.
 * 
 * @module getParseMode
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Получает строку с параметром parse_mode для Telegram бота на основе формата сообщения
 *
 * Функция преобразует формат сообщения (html, markdown) в соответствующую строку
 * с параметром parse_mode, которую можно использовать при отправке сообщений через Telegram API.
 * Если формат не указан или не поддерживается, возвращается пустая строка.
 *
 * @param formatMode - Формат сообщения ('html', 'markdown' или другой)
 * @returns Строка с параметром parse_mode или пустая строка
 *
 * @example
 * getParseMode('html') // Возвращает: ', parse_mode=ParseMode.HTML'
 * getParseMode('markdown') // Возвращает: ', parse_mode=ParseMode.MARKDOWN'
 * getParseMode('text') // Возвращает: ''
 */
export function getParseMode(formatMode: string): string {
  // Собираем код в массив строк для автоматической обработки
  const codeLines: string[] = [];
  
  // ИСПРАВЛЕНИЕ: Проверяем, что formatMode не пустой и не равен "none"
  if (formatMode && formatMode.trim() !== '' && formatMode.trim().toLowerCase() !== 'none') {
    if (formatMode.toLowerCase() === 'html') {
      codeLines.push(', parse_mode=ParseMode.HTML');
    } else if (formatMode.toLowerCase() === 'markdown') {
      codeLines.push(', parse_mode=ParseMode.MARKDOWN');
    }
  }
  // Если formatMode пустой или равен "none", возвращаем пустую строку
  
  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'getParseMode.ts');
  
  return processedCode.join('');
}
