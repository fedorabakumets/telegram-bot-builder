/** @fileoverview Копирование безопасного форматирования и обычного текста в разные форматы буфера. */
import { sanitizeRichHtml } from './safe-rich-html';

/**
 * Получает читаемый текст с переносами для приложений без поддержки HTML.
 * @param html - Очищенное содержимое редактора
 * @returns Обычный текст без тегов
 */
function plainText(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  const endsWithBlock = root.lastElementChild === root.lastChild
    && !!root.lastElementChild?.matches('div, p, blockquote, pre, h3, h4, h5');
  root.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  root.querySelectorAll('div, p, blockquote, pre, h3, h4, h5').forEach((node) => node.append('\n'));
  const text = root.textContent ?? '';
  return endsWithBlock ? text.replace(/\n$/, '') : text;
}

/**
 * Записывает HTML и текст одновременно; старые браузеры получают читаемый текст.
 * @param sourceHtml - Содержимое редактора
 * @returns Сохранено ли форматирование в буфере
 */
export async function copyRichHtml(sourceHtml: string): Promise<boolean> {
  const html = sanitizeRichHtml(sourceHtml);
  const text = plainText(html);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
      return true;
    } catch {
      // При запрете богатого буфера сохраняем хотя бы читаемый текст.
    }
  }
  await navigator.clipboard.writeText(text);
  return false;
}
