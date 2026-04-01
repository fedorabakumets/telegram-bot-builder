/**
 * @fileoverview Компонент подсветки совпадений текста при поиске
 * @module components/editor/sidebar/components/highlight-text
 */

import React from 'react';

/**
 * Пропсы компонента HighlightText
 */
interface HighlightTextProps {
  /** Исходный текст */
  text: string;
  /** Поисковый запрос для подсветки */
  query: string;
}

/**
 * Разбивает текст на части и подсвечивает совпадения с поисковым запросом
 * @param props - Свойства компонента
 * @returns JSX элемент с подсвеченными совпадениями
 */
export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query) {
    return <>{text}</>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-300/60 dark:bg-yellow-500/40 text-foreground rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
