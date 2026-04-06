/**
 * @fileoverview Парсер форматированного текста через DOMParser
 * @description Утилиты для парсинга HTML и Markdown форматирования
 * @module formatting-parser
 */

import { decodeHtmlEntities } from './html-entities';

/** Счётчик ключей для JSX элементов */
let keyCounter = 0;

/**
 * Рекурсивно обходит DOM-узел и создаёт JSX элементы
 * @param node - DOM-узел для обхода
 * @returns JSX элемент или null
 */
function nodeToJsx(node: Node): JSX.Element | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return <span key={keyCounter++}>{node.textContent}</span>;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  const children = Array.from(el.childNodes).map(nodeToJsx).filter(Boolean) as JSX.Element[];

  switch (tag) {
    case 'B':
    case 'STRONG':
      return <strong key={keyCounter++} className="font-bold">{children}</strong>;
    case 'I':
    case 'EM':
      return <em key={keyCounter++} className="italic">{children}</em>;
    case 'U':
      return <span key={keyCounter++} className="underline">{children}</span>;
    case 'S':
      return <span key={keyCounter++} className="line-through">{children}</span>;
    case 'CODE':
      return (
        <code key={keyCounter++} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    case 'BLOCKQUOTE':
      return (
        <blockquote key={keyCounter++} className="border-l-4 border-blue-500 pl-3 my-2 italic text-slate-600 dark:text-slate-400">
          {children}
        </blockquote>
      );
    case 'BR':
      return <br key={keyCounter++} />;
    default:
      return <>{children}</>;
  }
}

/**
 * Парсит HTML строку через DOMParser и возвращает массив JSX элементов
 * @param htmlText - HTML строка для парсинга
 * @returns Массив JSX элементов
 */
export function parseHTML(htmlText: string): JSX.Element[] {
  keyCounter = 0;
  const doc = new DOMParser().parseFromString(`<body>${htmlText}</body>`, 'text/html');
  return Array.from(doc.body.childNodes)
    .map(nodeToJsx)
    .filter(Boolean) as JSX.Element[];
}

/**
 * Форматирует текст с поддержкой HTML тегов
 * @param text - Текст для форматирования
 * @returns Отформатированный JSX элемент
 */
export function formatText(text: string): JSX.Element {
  if (!text) return <span>{text}</span>;

  const decodedText = decodeHtmlEntities(text);

  const hasHTMLTags =
    decodedText.includes('<b>') || decodedText.includes('<i>') ||
    decodedText.includes('<u>') || decodedText.includes('<s>') ||
    decodedText.includes('<code>') || decodedText.includes('<strong>') ||
    decodedText.includes('<em>') || decodedText.includes('<blockquote>') ||
    decodedText.includes('<br');

  const parsedParts = hasHTMLTags
    ? parseHTML(decodedText)
    : [<span key="0">{decodedText}</span>];

  return <span>{parsedParts}</span>;
}
