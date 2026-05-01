/**
 * @fileoverview Компонент отображения форматированного текста (read-only)
 * @description Рендерит HTML-теги как JSX без dangerouslySetInnerHTML.
 * Использует единый парсер из formatting-parser.
 * Переносы строк (\n), сохранённые в project.json, конвертируются в <br>
 * перед передачей в parseHTML, так как DOMParser игнорирует \n в тексте.
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
 * Заменяет символы переноса строки (\n) на тег <br> только вне HTML-тегов.
 * Это необходимо, так как DOMParser схлопывает whitespace и игнорирует \n.
 * Уже существующие <br> в HTML-разметке не затрагиваются.
 * @param value - Исходная строка, возможно содержащая \n и HTML-теги
 * @returns Строка с \n, заменёнными на <br> вне тегов
 */
function normalizeNewlines(value: string): string {
  /** Разбиваем строку на части: HTML-теги и текст между ними */
  return value.replace(/(<[^>]*>)|(\n)/g, (match, tag) => {
    /** Если совпал HTML-тег — оставляем как есть */
    if (tag) return match;
    /** Если совпал \n вне тега — заменяем на <br> */
    return '<br>';
  });
}

/**
 * Компонент отображения форматированного текста
 * @param props - Свойства компонента
 * @returns JSX-элемент с форматированным текстом или null
 */
export function FormattedText({ value, className = '', lineClamp }: FormattedTextProps) {
  if (!value) return null;

  /**
   * Мемоизируем результат парсинга для предотвращения лишних вычислений.
   * Перед парсингом конвертируем \n → <br>, чтобы DOMParser не потерял переносы.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const parsed = useMemo(() => parseHTML(normalizeNewlines(value)), [value]);

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';

  return (
    <div
      className={`text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium break-words ${lineClampClass} ${className}`}
    >
      {parsed}
    </div>
  );
}
