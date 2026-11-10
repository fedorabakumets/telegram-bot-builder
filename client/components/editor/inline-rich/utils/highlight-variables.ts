/**
 * @fileoverview Утилита подсветки переменных в HTML редактора
 */

/**
 * Регулярное выражение для поиска переменных вида {name} или {name|filter}
 */
const VARIABLE_REGEX = /\{([^}|]+)(\|[^}]+)?\}/g;

/**
 * Регулярное выражение для поиска и удаления span-обёрток переменных.
 * Нежадный поиск атрибутов гарантирует корректную работу при любом порядке атрибутов.
 */
const VARIABLE_CHIP_REGEX =
  /<span\b[^>]*class="variable-chip"[^>]*>(\{[^}]*\})<\/span>/g;

/**
 * Оборачивает переменные в HTML-строке в span с классом подсветки
 * @param html - HTML строка из редактора
 * @returns HTML строка с обёрнутыми переменными
 */
export function highlightVariables(html: string): string {
  if (typeof document === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  texts.forEach((text) => {
    if (text.parentElement?.closest('.variable-chip')) return;
    const value = text.data;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of value.matchAll(VARIABLE_REGEX)) {
      fragment.append(document.createTextNode(value.slice(offset, match.index)));
      const chip = document.createElement('span');
      chip.className = 'variable-chip';
      chip.setAttribute('data-variable', match[1].trim());
      chip.setAttribute('contenteditable', 'false');
      chip.textContent = `{${match[1].trim()}${match[2] ?? ''}}`;
      fragment.append(chip);
      offset = match.index! + match[0].length;
    }
    fragment.append(document.createTextNode(value.slice(offset)));
    text.replaceWith(fragment);
  });
  return template.innerHTML;
}

/**
 * Убирает обёртку span с переменных, возвращая чистый текст
 * @param html - HTML строка с обёрнутыми переменными
 * @returns HTML строка без обёрток переменных
 */
export function unwrapVariables(html: string): string {
  return html.replace(VARIABLE_CHIP_REGEX, (_match, variableText: string) => variableText);
}
