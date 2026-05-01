/**
 * @fileoverview Утилита санитизации HTML для Telegram: экранирование и стриппинг тегов
 * @module utils/escape-html-content
 * @description Оставляет только теги поддерживаемые Telegram Bot API,
 * экранирует спецсимволы в текстовых узлах, удаляет всё остальное.
 */

/**
 * Теги разрешённые Telegram Bot API (parse_mode=HTML).
 * Всё остальное стрипается — содержимое сохраняется, тег удаляется.
 */
const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del',
  'code', 'pre', 'blockquote', 'a', 'tg-spoiler', 'br',
]);

/**
 * Экранирует спецсимволы HTML в одной текстовой строке.
 * Порядок важен: сначала `&`, чтобы избежать двойного экранирования.
 * @param text - Исходная строка
 * @returns Строка с экранированными `&`, `<`, `>`
 */
function escapeTextNode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Рекурсивно обходит DOM-узел:
 * - текстовые узлы — экранирует спецсимволы
 * - разрешённые теги — обходит рекурсивно
 * - запрещённые теги (font, span, div и т.д.) — заменяет их содержимым (unwrap)
 * @param node - Корневой DOM-узел для обхода
 */
function walkAndSanitize(node: Node): void {
  // Обходим копию списка — будем мутировать DOM
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent = escapeTextNode(child.textContent ?? '');
      return;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (ALLOWED_TAGS.has(tag)) {
        // Разрешённый тег — рекурсивно обрабатываем содержимое
        walkAndSanitize(el);
      } else {
        // Запрещённый тег — сначала обрабатываем содержимое, потом unwrap
        walkAndSanitize(el);
        // Переносим дочерние узлы перед элементом, затем удаляем сам элемент
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.parentNode?.removeChild(el);
      }
    }
  });
}

/**
 * Санитизирует HTML из contenteditable:
 * - удаляет теги не поддерживаемые Telegram (font, span, div и т.д.)
 * - экранирует `<`, `>`, `&` в текстовых узлах
 * - сохраняет теги форматирования Telegram нетронутыми
 * @param html - HTML-строка из contenteditable редактора
 * @returns Безопасная HTML-строка для Telegram
 */
export function escapeHtmlContent(html: string): string {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

  walkAndSanitize(doc.body);

  return doc.body.innerHTML;
}
