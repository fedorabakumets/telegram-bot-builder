/**
 * @fileoverview Компонент отображения форматированного текста
 * @description Read-only отображение текста с поддержкой HTML форматирования
 *
 * Использует ту же логику конвертации, что и InlineRichEditor
 *
 * @module FormattedText
 */

import { valueToHtml } from '../html-converter';

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

  // Проверяем, что текст не пустой (игнорируя HTML теги, пробелы и переносы)
  const plainText = value
    .replace(/<[^>]*>/g, '')       // HTML теги (первый проход)
    .replace(/&nbsp;/g, ' ')       // HTML сущности
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')       // HTML теги (второй проход после декодирования)
    .replace(/\n/g, '')            // Символы новой строки
    .replace(/\r/g, '')
    .trim();

  // Если после удаления всех тегов и пробелов пусто - не отображаем
  if (!plainText) {
    return null;
  }

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';
  const html = valueToHtml(value, false);

  return (
    <div
      className={`text-sm text-blue-700 dark:text-blue-300 leading-relaxed font-medium ${lineClampClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
