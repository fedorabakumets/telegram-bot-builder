/**
 * @fileoverview Утилиты конвертации между текстом и HTML
 * @description Преобразование Markdown ↔ HTML для contenteditable редактора
 */

import { decodeHtmlEntities } from './utils/html-entities';
import { highlightVariables, unwrapVariables } from './utils/highlight-variables';

/**
 * Преобразует текст в HTML для отображения в contenteditable
 * @param text - Исходный текст
 * @param enableMarkdown - Включить поддержку Markdown
 * @returns HTML строка для отображения
 */
export function valueToHtml(text: string, enableMarkdown: boolean): string {
  if (!text) return '';

  // Сначала декодируем HTML-сущности (если они есть)
  let html = decodeHtmlEntities(text);

  if (enableMarkdown) {
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h5>$1</h5>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
  } else {
    html = html.replace(/\n/g, '<br>');
  }

  return highlightVariables(html);
}

/**
 * Преобразует HTML обратно в текстовое значение
 * @param html - HTML строка
 * @param enableMarkdown - Включить поддержку Markdown
 * @returns Текстовое значение
 */
export function htmlToValue(html: string, enableMarkdown: boolean): string {
  if (!html) return '';

  // Сначала убираем span-обёртки переменных, затем декодируем HTML-сущности
  let text = decodeHtmlEntities(unwrapVariables(html));

  if (enableMarkdown) {
    text = text
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/g, '__$1__')
      .replace(/<s[^>]*>(.*?)<\/s>/g, '~~$1~~')
      .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '# $1')
      .replace(/<h4[^>]*>(.*?)<\/h4>/g, '## $1')
      .replace(/<h5[^>]*>(.*?)<\/h5>/g, '### $1')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '');
  } else {
    // Даже без Markdown сохраняем теги форматирования для Telegram
    text = text
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '<b>$1</b>')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '<i>$1</i>')
      .replace(/<u[^>]*>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/<s[^>]*>(.*?)<\/s>/g, '<s>$1</s>')
      .replace(/<code[^>]*>(.*?)<\/code>/g, '<code>$1</code>')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '<blockquote>$1</blockquote>')
      .replace(/<h[3-5][^>]*>(.*?)<\/h[3-5]>/g, '<b>$1</b>')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '');
  }

  // Очищаем пустые значения (только пробелы и новые строки)
  return text.trim() === '' ? '' : text;
}
