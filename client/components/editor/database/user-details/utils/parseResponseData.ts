/**
 * @fileoverview Утилита парсинга данных ответа
 * @description Преобразует сырые данные в структурированный формат
 */

/**
 * @interface ResponseData
 * @description Структурированные данные ответа
 */
export interface ResponseData {
  /** Значение ответа */
  value?: string | number | boolean;
  /** Тип ответа */
  type?: string;
  /** URL фото (если есть) */
  photoUrl?: string;
  /** Массив медиа (если есть) */
  media?: Array<{ url: string } | string>;
}

/**
 * Парсит данные ответа пользователя
 * @param {unknown} value - Сырое значение ответа
 * @returns {ResponseData} Структурированные данные
 */
export function parseResponseData(value: unknown): ResponseData {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as ResponseData;
    } catch {
      return { value, type: 'text' };
    }
  }

  if (typeof value === 'object' && value !== null) {
    return value as ResponseData;
  }

  return { value: String(value), type: 'text' };
}

/**
 * Получает отображаемое значение ответа
 * @param {ResponseData} data - Данные ответа
 * @param {unknown} rawValue - Исходное значение
 * @returns {string} Строка для отображения
 */
export function getAnswerValue(data: ResponseData, rawValue: unknown): string {
  if (data.value !== undefined) {
    return String(data.value);
  }

  if (typeof rawValue === 'object' && rawValue !== null) {
    return JSON.stringify(rawValue);
  }

  return String(rawValue);
}
