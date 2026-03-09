/**
 * @fileoverview Тип данных ответа пользователя
 * @description Структурированные данные ответа
 */

/**
 * Структурированные данные ответа
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
