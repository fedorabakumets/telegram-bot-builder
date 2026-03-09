/**
 * @fileoverview Типы для конфигурации кнопочного ответа
 * Используется в generate-button-response-config
 */

/**
 * Тип варианта ответа для кнопочного ввода
 */
export interface ResponseOption {
  /** Текст варианта ответа */
  text: string;
  /** Значение варианта */
  value?: string;
  /** Действие варианта */
  action?: string;
  /** Цель перехода */
  target?: string;
  /** URL для кнопки */
  url?: string;
}

/**
 * Тип кнопки для конфигурации ответа
 */
export interface Button {
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: string;
  /** Цель перехода */
  target: string;
  /** ID кнопки */
  id: string;
}
