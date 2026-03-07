/**
 * @fileoverview Парсер форматированного текста
 * @description Утилиты для парсинга HTML и Markdown форматирования
 *
 * @module formatting-parser
 */

import { htmlToValue } from '../html-converter';

/**
 * Парсит HTML строку и возвращает массив JSX элементов
 *
 * @param {string} htmlText - HTML строка для парсинга
 * @returns {JSX.Element[]} Массив JSX элементов
 *
 * @example
 * const elements = parseHTML('<b>жирный</b> <i>курсив</i>');
 */
export function parseHTML(htmlText: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  let remaining = htmlText;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)<(?:b|strong)>(.*?)<\/(?:b|strong)>(.*)/s);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++} className="font-bold">{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^(.*?)<(?:i|em)>(.*?)<\/(?:i|em)>(.*)/s);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    // Underline
    const underlineMatch = remaining.match(/^(.*?)<u>(.*?)<\/u>(.*)/s);
    if (underlineMatch) {
      if (underlineMatch[1]) parts.push(<span key={key++}>{underlineMatch[1]}</span>);
      parts.push(<span key={key++} className="underline">{underlineMatch[2]}</span>);
      remaining = underlineMatch[3];
      continue;
    }

    // Strike
    const strikeMatch = remaining.match(/^(.*?)<s>(.*?)<\/s>(.*)/s);
    if (strikeMatch) {
      if (strikeMatch[1]) parts.push(<span key={key++}>{strikeMatch[1]}</span>);
      parts.push(<span key={key++} className="line-through">{strikeMatch[2]}</span>);
      remaining = strikeMatch[3];
      continue;
    }

    // Code
    const codeMatch = remaining.match(/^(.*?)<code>(.*?)<\/code>(.*)/s);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(<code key={key++} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>);
      remaining = codeMatch[3];
      continue;
    }

    // Blockquote
    const blockquoteMatch = remaining.match(/^(.*?)<blockquote>(.*?)<\/blockquote>(.*)/s);
    if (blockquoteMatch) {
      if (blockquoteMatch[1]) parts.push(<span key={key++}>{blockquoteMatch[1]}</span>);
      parts.push(
        <blockquote key={key++} className="border-l-4 border-blue-500 pl-3 my-2 italic text-slate-600 dark:text-slate-400">
          {parseHTML(blockquoteMatch[2])}
        </blockquote>
      );
      remaining = blockquoteMatch[3];
      continue;
    }

    // Line break
    const brMatch = remaining.match(/^(.*?)<br\s*\/?>(.*)/s);
    if (brMatch) {
      if (brMatch[1]) parts.push(<span key={key++}>{brMatch[1]}</span>);
      parts.push(<br key={key++} />);
      remaining = brMatch[2];
      continue;
    }

    // Нет больше тегов
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

/**
 * Форматирует текст с поддержкой HTML тегов
 *
 * @param {string} text - Текст для форматирования
 * @returns {JSX.Element} Отформатированный JSX элемент
 *
 * @example
 * const formatted = formatText('<b>Привет</b> <i>мир</i>');
 */
export function formatText(text: string): JSX.Element {
  if (!text) return <span>{text}</span>;

  // Декодируем HTML-сущности (&lt; → <) через htmlToValue
  const decodedText = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  const hasHTMLTags = decodedText.includes('<b>') || decodedText.includes('<i>') || decodedText.includes('<u>') ||
                     decodedText.includes('<s>') || decodedText.includes('<code>') || decodedText.includes('<strong>') ||
                     decodedText.includes('<em>') || decodedText.includes('<blockquote>') || decodedText.includes('<br');

  const parsedParts = hasHTMLTags ? parseHTML(decodedText) : [<span key="0">{decodedText}</span>];
  return <span>{parsedParts}</span>;
}
