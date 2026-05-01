/**
 * @fileoverview Утилиты конвертации между текстом и HTML
 * @description Преобразование Markdown ↔ HTML для contenteditable редактора.
 * Поддерживает Telegram-специфичные теги: tg-spoiler, blockquote expandable.
 */

import { decodeHtmlEntities } from './utils/html-entities';
import { escapeHtmlContent } from './utils/escape-html-content';
import { highlightVariables, unwrapVariables } from './utils/highlight-variables';

/**
 * Заменяет \n на <br> во всём HTML, включая содержимое тегов <pre>.
 * Браузер в contenteditable игнорирует \n в innerHTML даже при white-space:pre,
 * поэтому переносы нужно явно конвертировать в <br>.
 * При обратной конвертации (htmlToValue) <br> внутри <pre> возвращаются в \n.
 * @param html - HTML строка
 * @returns HTML строка с <br> вместо всех \n
 */
function replaceNewlinesOutsidePre(html: string): string {
  return html.replace(/\n/g, '<br>');
}

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
      /** Синтаксис спойлера Telegram: ||текст|| → <tg-spoiler> */
      .replace(/\|\|(.*?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h5>$1</h5>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = replaceNewlinesOutsidePre(html);
  } else {
    html = replaceNewlinesOutsidePre(html);
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
      /** Спойлер в Markdown-режиме: <tg-spoiler> → ||текст|| */
      .replace(/<tg-spoiler[^>]*>(.*?)<\/tg-spoiler>/g, '||$1||')
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
    // Экранируем спецсимволы в текстовых узлах до замены тегов,
    // чтобы <, > и & в пользовательском тексте не ломали Telegram HTML-парсер
    text = escapeHtmlContent(text);

    // Даже без Markdown сохраняем теги форматирования для Telegram
    text = text
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '<b>$1</b>')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '<i>$1</i>')
      .replace(/<u[^>]*>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/<s[^>]*>(.*?)<\/s>/g, '<s>$1</s>')
      /** Спойлер в HTML-режиме: сохраняем тег tg-spoiler для Telegram */
      .replace(/<tg-spoiler[^>]*>(.*?)<\/tg-spoiler>/g, '<tg-spoiler>$1</tg-spoiler>')
      /** Блок кода: <pre> сохраняем как есть для Telegram (флаг s — dotAll для многострочного текста).
       * Если внутри <pre> есть <code class="language-XXX"> — сохраняем обёртку с классом.
       * <br> внутри <pre> конвертируем обратно в \n перед сохранением. */
      .replace(/<pre[^>]*>(.*?)<\/pre>/gs, (_, inner) => {
        // Проверяем наличие <code class="language-XXX">
        const langMatch = inner.match(/<code[^>]*class="language-([^"]+)"[^>]*>([\s\S]*?)<\/code>/);
        if (langMatch) {
          const lang = langMatch[1];
          const codeContent = langMatch[2].replace(/<br\s*\/?>/gi, '\n');
          return `<pre><code class="language-${lang}">${codeContent}</code></pre>`;
        }
        return `<pre>${inner.replace(/<br\s*\/?>/gi, '\n')}</pre>`;
      })
      .replace(/<code[^>]*>(.*?)<\/code>/g, '<code>$1</code>')
      /** Раскрывающаяся цитата — должна идти ПЕРВОЙ, до обычного blockquote */
      .replace(/<blockquote\s+expandable[^>]*>(.*?)<\/blockquote>/gs, '<blockquote expandable>$1</blockquote>')
      /** Обычная цитата */
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '<blockquote>$1</blockquote>')
      .replace(/<h[3-5][^>]*>(.*?)<\/h[3-5]>/g, '<b>$1</b>')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '');
  }

  // Очищаем пустые значения (только пробелы и новые строки)
  return text.trim() === '' ? '' : text;
}
