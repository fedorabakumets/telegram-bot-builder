/**
 * @fileoverview Типы данных ответа пользователя
 * @description Интерфейс для хранения данных, полученных от пользователя в ответ на вопросы бота
 */

/**
 * Данные ответа пользователя
 * @interface
 */
export interface ResponseData {
  /** Значение ответа */
  value?: string;
  /** Тип данных ответа */
  type?: string;
  /** Текст вопроса (prompt) */
  prompt?: string;
  /** Временная метка ответа */
  timestamp?: Date | string;
  /** ID узла, где был получен ответ */
  nodeId?: string | number;
  /** URL фотографии */
  photoUrl?: string;
  /** Медиа-файлы */
  media?: Array<{ url: string } | string>;
  /** Дополнительные свойства */
  [key: string]: unknown;
}
