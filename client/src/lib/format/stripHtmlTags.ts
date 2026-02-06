import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Удаляет HTML теги из текста
 *
 * Функция принимает текст, содержащий HTML теги, и возвращает текст без этих тегов.
 * Используется для очистки форматированного текста перед отправкой через Telegram API,
 * когда режим парсинга не поддерживает HTML.
 *
 * @param text - Текст с HTML тегами
 * @returns Текст без HTML тегов
 *
 * @example
 * stripHtmlTags('<b>Жирный текст</b>') // Возвращает: 'Жирный текст'
 * stripHtmlTags('<p>Абзац <i>с курсивом</i></p>') // Возвращает: 'Абзац с курсивом'
 */
export function stripHtmlTags(text: string): string {
  // Собираем код в массив строк для автоматической обработки
  const codeLines: string[] = [];
  
  if (!text) {
    codeLines.push(text);
  } else {
    codeLines.push(text.replace(/<[^>]*>/g, ''));
  }
  
  // Применяем автоматическое добавление комментариев ко всему коду
  processCodeWithAutoComments(codeLines, 'stripHtmlTags.ts');
  
  // Возвращаем результат
  return !text ? text : text.replace(/<[^>]*>/g, '');
}
