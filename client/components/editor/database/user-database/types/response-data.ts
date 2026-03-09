/**
 * Данные ответа пользователя на вопрос бота
 */
export interface ResponseData {
  /** Значение ответа пользователя (текст, число, email и т.д.) */
  value?: string;

  /** Тип данных ответа: "text", "number", "email", "phone", "photo", "video", "audio", "document" */
  type?: string;

  /** Текст вопроса, на который получен ответ */
  prompt?: string;

  /** Дата и время, когда пользователь предоставил ответ */
  timestamp?: Date | string;

  /** Идентификатор узла в схеме бота, где был получен ответ */
  nodeId?: string | number;

  /** URL загруженной пользователем фотографии */
  photoUrl?: string;

  /** Массив медиа-файлов в ответе */
  media?: Array<{ url: string } | string>;

  /** Индекс сигнатур для дополнительных динамических свойств */
  [key: string]: unknown;
}
