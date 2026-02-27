/**
 * @fileoverview Компонент форматированного текста
 * @description Рендерит HTML с поддержкой тегов Telegram (b, i, u, s, code, etc.)
 */

import { useMemo } from 'react';

/**
 * Свойства форматированного текста
 */
interface FormattedTextProps {
  /** Текст с HTML-тегами */
  text?: string | null;
  /** Тип сообщения для стилей */
  messageType: 'bot' | 'user';
}

/**
 * Компонент текста с поддержкой HTML-форматирования
 */
export function FormattedText({ text, messageType }: FormattedTextProps) {
  const isBot = messageType === 'bot';

  /**
   * Преобразует HTML-строку в массив React-элементов
   * Поддерживает теги: b, strong, i, em, u, s, strike, del, code, pre, a
   */
  const formattedContent = useMemo(() => {
    if (!text) return null;

    const content = String(text).trimEnd();

    // Простая функция для парсинга HTML с тегами форматирования
    const parseFormattedText = (html: string): (string | JSX.Element)[] => {
      const elements: (string | JSX.Element)[] = [];
      let remaining = html;
      let keyIndex = 0;

      while (remaining.length > 0) {
        // Ищем ближайший открывающий тег
        const tagMatch = remaining.match(/<(b|strong|i|em|u|s|strike|del|code|pre|a[^>]*)>([\s\S]*?)<\/\1>|<(br\s*\/?)>/i);

        if (!tagMatch || tagMatch.index === undefined) {
          // Тегов больше нет, добавляем оставшийся текст
          if (remaining) {
            elements.push(remaining);
          }
          break;
        }

        const startIndex = tagMatch.index;

        // Добавляем текст до тега
        if (startIndex > 0) {
          elements.push(remaining.slice(0, startIndex));
        }

        const fullMatch = tagMatch[0];
        const tagName = tagMatch[1]?.toLowerCase() || '';
        const innerContent = tagMatch[2];

        // Обработка тега
        if (tagName === 'br' || tagName === 'br/') {
          elements.push('\n');
        } else if (tagName === 'a') {
          const hrefMatch = tagName.match(/href="([^"]*)"/);
          const href = hrefMatch ? hrefMatch[1] : '#';
          elements.push(
            <a
              key={keyIndex++}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline break-all"
            >
              {innerContent}
            </a>
          );
        } else {
          // Рекурсивно обрабатываем содержимое тега
          const children = parseFormattedText(innerContent || '');

          const baseClasses = 'inline';
          let className = baseClasses;

          switch (tagName) {
            case 'b':
            case 'strong':
              className += ' font-bold';
              break;
            case 'i':
            case 'em':
              className += ' italic';
              break;
            case 'u':
              className += ' underline';
              break;
            case 's':
            case 'strike':
            case 'del':
              className += ' line-through';
              break;
            case 'code':
            case 'pre':
              className += ' bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono';
              break;
          }

          elements.push(
            <span key={keyIndex++} className={className}>
              {children}
            </span>
          );
        }

        // Переходим к следующей части после тега
        remaining = remaining.slice(startIndex + fullMatch.length);
      }

      return elements;
    };

    return parseFormattedText(content);
  }, [text]);

  return (
    <div className={`rounded-lg px-3 py-2 ${
        isBot
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
          : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
      }`}>
      <p className="text-sm whitespace-pre-wrap break-words">
        {formattedContent}
      </p>
    </div>
  );
}
