/**
 * @fileoverview Утилита экранирования HTML-сущностей в текстовых узлах
 * @module utils/escape-html-content
 * @description Обходит DOM-дерево и экранирует спецсимволы только в текстовых узлах,
 * не затрагивая сами HTML-теги форматирования.
 */

/**
 * Экранирует спецсимволы HTML в одной текстовой строке.
 * Порядок важен: сначала `&`, чтобы не двойного экранирования.
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
 * Рекурсивно обходит дочерние узлы и экранирует текстовые узлы.
 * Узлы типа `Node.TEXT_NODE` (nodeType === 3) обрабатываются,
 * остальные — обходятся рекурсивно.
 * @param node - Корневой DOM-узел для обхода
 */
function walkAndEscape(node: Node): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent = escapeTextNode(child.textContent ?? '');
    } else {
      walkAndEscape(child);
    }
  });
}

/**
 * Экранирует `<`, `>`, `&` внутри текстовых узлов HTML-строки,
 * сохраняя теги форматирования нетронутыми.
 * Использует DOMParser для безопасного разбора HTML.
 * @param html - HTML-строка из contenteditable редактора
 * @returns HTML-строка с экранированным текстовым содержимым
 */
export function escapeHtmlContent(html: string): string {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

  walkAndEscape(doc.body);

  return doc.body.innerHTML;
}
