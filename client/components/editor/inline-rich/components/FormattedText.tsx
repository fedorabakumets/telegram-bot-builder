/**
 * @fileoverview Компонент отображения форматированного текста
 * @description Read-only отображение текста с поддержкой HTML форматирования
 *
 * @module FormattedText
 */

import { formatText } from '../utils/formatting-parser';

/**
 * Свойства компонента FormattedText
 */
export interface FormattedTextProps {
  /** Текст с HTML тегами */
  value: string;
  /** Дополнительные CSS классы */
  className?: string;
  /** Ограничение по строкам (line-clamp) */
  lineClamp?: number;
}

/**
 * Компонент отображения форматированного текста
 *
 * @param {FormattedTextProps} props - Свойства компонента
 * @returns {JSX.Element} Отформатированный текст
 *
 * @example
 * <FormattedText value="<b>Привет</b> <i>мир</i>" className="text-sm" lineClamp={3} />
 */
export function FormattedText({ value, className = '', lineClamp }: FormattedTextProps) {
  if (!value) {
    return null;
  }

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';

  return (
    <div className={`text-sm text-blue-700 dark:text-blue-300 leading-relaxed font-medium ${lineClampClass} ${className}`}>
      {formatText(value)}
    </div>
  );
}
