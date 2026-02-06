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
  
  if (formatMode === 'html') {
    codeLines.push(', parse_mode=ParseMode.HTML');
  } else if (formatMode === 'markdown') {
    codeLines.push(', parse_mode=ParseMode.MARKDOWN');
  } else {
    codeLines.push('');
  }
  
  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'getParseMode.ts');
  
  return processedCode.join('');
}
