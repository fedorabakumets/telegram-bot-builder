/**
 * @fileoverview Тип данных кнопки для переходов
 * Используется при генерации клавиатур и обработчиков кнопок
 */

/**
 * Данные кнопки для переходов
 */
export interface ButtonData {
  /** Уникальный идентификатор кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: 'command' | 'location' | 'contact' | 'goto' | 'url' | 'selection' | 'default';
  /** Тип кнопки */
  buttonType: 'normal' | 'option' | 'complete';
  /** Пропускать сбор данных */
  skipDataCollection?: boolean;
  /** Скрыть после нажатия */
  hideAfterClick?: boolean;
  /** URL для кнопки */
  url?: string;
  /** Цель перехода (ID узла) */
  target?: string;
  /** Запрос контакта */
  requestContact?: boolean;
  /** Запрос локации */
  requestLocation?: boolean;
}
