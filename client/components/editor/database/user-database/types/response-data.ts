/**
 * @fileoverview Типы данных ответа пользователя
 * @description Интерфейс для хранения данных, полученных от пользователя в ответ на вопросы бота
 * @module
 */

/**
 * Данные ответа пользователя на вопрос бота
 * @interface ResponseData
 * @description Используется для парсинга и отображения ответов пользователей в панели базы данных
 * @description Хранится в поле userData таблицы пользователей в формате JSON
 */
export interface ResponseData {
  /**
   * Значение ответа пользователя (текст, число, email и т.д.)
   * @type {string}
   * @optional
   */
  value?: string;

  /**
   * Тип данных ответа
   * @type {string}
   * @optional
   * @description Возможные значения: "text", "number", "email", "phone", "photo", "video", "audio", "document"
   */
  type?: string;

  /**
   * Текст вопроса, на который получен ответ
   * @type {string}
   * @optional
   * @description Сохраняется из messageText узла, где был задан вопрос
   */
  prompt?: string;

  /**
   * Временная метка получения ответа
   * @type {Date | string}
   * @optional
   * @description Дата и время, когда пользователь предоставил ответ
   */
  timestamp?: Date | string;

  /**
   * Идентификатор узла в схеме бота, где был получен ответ
   * @type {string | number}
   * @optional
   * @description Ссылка на узел типа "Сообщение" или "Форма", где был задан вопрос
   */
  nodeId?: string | number;

  /**
   * URL загруженной пользователем фотографии
   * @type {string}
   * @optional
   * @description Используется когда тип ответа "photo" и файл загружен на сервер
   */
  photoUrl?: string;

  /**
   * Массив медиа-файлов в ответе
   * @type {Array<{ url: string } | string>}
   * @optional
   * @description Может содержать объекты с URL или строки с путями к файлам
   */
  media?: Array<{ url: string } | string>;

  /**
   * Индекс сигнатур для дополнительных динамических свойств
   * @type {unknown}
   * @description Позволяет добавлять произвольные поля к ответу
   */
  [key: string]: unknown;
}
