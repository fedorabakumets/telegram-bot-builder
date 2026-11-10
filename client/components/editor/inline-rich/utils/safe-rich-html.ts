/** @fileoverview Безопасное подмножество HTML редактора и протоколов ссылок. */

/** Разрешённые теги Telegram и служебные обёртки редактора. */
const TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del',
  'code', 'pre', 'blockquote', 'a', 'tg-spoiler', 'br', 'h3', 'h4', 'h5', 'span', 'div', 'p']);
/** Элементы, содержимое которых не является пользовательским текстом. */
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template']);
/** Протоколы, допустимые для переходов из редактора и предпросмотра. */
const PROTOCOLS = new Set(['http:', 'https:', 'tg:', 'mailto:', 'tel:']);

/**
 * Проверяет ссылку, включая относительные адреса и шаблонные переменные.
 * @param value - Исходный адрес
 * @returns Безопасный адрес либо null
 */
export function safeRichUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  if (/&(?:#\w+|colon|tab|newline);/i.test(trimmed)) return null;
  try {
    return PROTOCOLS.has(new URL(trimmed, 'https://editor.invalid/').protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Создаёт разрешённый узел заново, не копируя обработчики и произвольные атрибуты.
 * @param source - Недоверенный узел из инертного шаблона
 * @param parent - Безопасный родитель
 */
function copySafeNode(source: Node, parent: Node): void {
  if (source.nodeType === Node.TEXT_NODE) {
    parent.appendChild(document.createTextNode(source.textContent ?? ''));
    return;
  }
  if (source.nodeType !== Node.ELEMENT_NODE) return;
  const element = source as Element;
  const tag = element.localName.toLowerCase();
  if (DROP.has(tag) || element.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
  if (!TAGS.has(tag)) {
    Array.from(element.childNodes).forEach((child) => copySafeNode(child, parent));
    return;
  }
  const clean = document.createElement(tag);
  if (tag === 'a') {
    const href = safeRichUrl(element.getAttribute('href') ?? '');
    if (href) clean.setAttribute('href', href);
  }
  if (tag === 'blockquote' && element.hasAttribute('expandable')) clean.setAttribute('expandable', '');
  if (tag === 'code') {
    const language = element.className.match(/(?:^|\s)language-([\w+-]+)(?:\s|$)/)?.[1];
    if (language) clean.className = `language-${language}`;
  }
  if (tag === 'span' && element.classList.contains('variable-chip')) {
    clean.className = 'variable-chip';
    clean.setAttribute('data-variable', element.getAttribute('data-variable') ?? '');
    clean.setAttribute('contenteditable', 'false');
  }
  Array.from(element.childNodes).forEach((child) => copySafeNode(child, clean));
  parent.appendChild(clean);
}

/**
 * Очищает HTML перед вставкой в живой DOM и перед сохранением редактора.
 * @param html - Недоверенный HTML
 * @returns HTML только с разрешённым форматированием
 */
export function sanitizeRichHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  const source = document.createElement('template');
  source.innerHTML = html;
  const output = document.createElement('div');
  Array.from(source.content.childNodes).forEach((child) => copySafeNode(child, output));
  return output.innerHTML;
}
