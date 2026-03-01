/**
 * @fileoverview Типы для кнопок бота
 * 
 * Модуль определяет структуру данных для кнопок клавиатуры Telegram бота.
 * Поддерживает inline и reply кнопки с различными действиями.
 * 
 * @module bot-generator/types/button-types
 */

import { z } from 'zod';
import { buttonSchema } from '@shared/schema';

/**
 * Тип действия кнопки
 * 
 * @example
 * const action: ButtonAction = 'goto';
 */
export type ButtonAction = 
  | 'goto'           /** Переход к другому узлу */
  | 'callback'       /** Callback для inline кнопок */
  | 'url'            /** Открытие URL */
  | 'command'        /** Выполнение команды */
  | 'contact'        /** Отправка контакта */
  | 'location'       /** Отправка геолокации */
  | 'pay'            /** Оплата */
  | 'login_url'      /** URL авторизации */
  | 'switch_inline'  /** Switch inline */
  | 'switch_current' /** Switch current chat */
  | 'copy_text'      /** Копирование текста */
  | 'request_poll'  /** Создание опроса */
  | 'web_app'        /** Web App */
  | 'user'           /** Выбор пользователя */
  | 'group'          /** Выбор группы */
  | 'bot'            /** Выбор бота */
  | 'hide'           /** Скрыть клавиатуру */
  | 'text';          /** Текстовая кнопка */

/** Тип кнопки бота из схемы Zod */
export type Button = z.infer<typeof buttonSchema>;

/**
 * Интерфейс для опции ответа
 * 
 * @example
 * const option: ResponseOption = {
 *   text: 'Да',
 *   value: 'yes',
 *   target: 'confirm_node'
 * };
 */
export interface ResponseOption {
  /** Текст опции ответа */
  text: string;
  /** Значение, связанное с опцией */
  value?: string;
  /** Действие при выборе */
  action?: string;
  /** Целевой узел для перехода */
  target?: string;
  /** URL для внешней ссылки */
  url?: string;
}
