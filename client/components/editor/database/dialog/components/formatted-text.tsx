/**
 * @fileoverview Компонент форматированного текста для диалога
 * @description Рендерит HTML с поддержкой тегов Telegram (b, i, u, s, code и др.)
 * через единый парсер из formatting-parser.
 */

import { useMemo } from 'react';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';

/**
 * Свойства компонента форматированного текста
 */
interface FormattedTextProps {
  /** Текст с HTML-тегами (может быть null или undefined) */
  text?: string | null;
  /** Тип сообщения для выбора цветовой схемы */
  messageType: 'bot' | 'user';
}

/**
 * Компонент текста с поддержкой HTML-форматирования
 * @param props - Свойства компонента
 * @returns JSX-элемент с форматированным текстом
 */
export function FormattedText({ text, messageType }: FormattedTextProps) {
  const isBot = messageType === 'bot';

  /** Парсим HTML в JSX только при изменении текста */
  const formattedContent = useMemo(() => {
    if (typeof text !== 'string' || !text.trim()) return null;
    return parseHTML(text.trimEnd());
  }, [text]);

  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        isBot
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
          : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap break-words">
        {formattedContent}
      </p>
    </div>
  );
}
