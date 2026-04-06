/**
 * @fileoverview Компонент отображения форматированного текста (read-only)
 * @description Рендерит HTML-теги как JSX без dangerouslySetInnerHTML.
 * Использует единый парсер из formatting-parser.
 */

import { useMemo } from 'react';
import { parseHTML } from '../utils/formatting-parser';

/**
 * Свойства компонента FormattedText
 */
export interface FormattedTextProps {
  /** Текст с HTML-тегами для отображения */
  value: string;
  /** Дополнительные CSS-классы контейнера */
  className?: string;
  /** Ограничение количества строк (line-clamp) */
  lineClamp?: number;
}

/**
 * Компонент отображения форматированного текста
 * @param props - Свойства компонента
 * @returns JSX-элемент с форматированным текстом или null
 */
export function FormattedText({ value, className = '', lineClamp }: FormattedTextProps) {
  if (!value) return null;

  /** Мемоизируем результат парсинга для предотвращения лишних вычислений */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const parsed = useMemo(() => parseHTML(value), [value]);

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';

  return (
    <div
      className={`text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium break-words ${lineClampClass} ${className}`}
    >
      {parsed}
    </div>
  );
}
