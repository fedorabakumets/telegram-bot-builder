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
 * Тип действия кнопки — строго соответствует buttonSchema из @shared/schema
 *
 * @example
 * const action: ButtonAction = 'goto';
 */
export type ButtonAction =
  | 'goto'       /** Переход к другому узлу */
  | 'command'    /** Выполнение команды */
  | 'url'        /** Открытие URL */
  | 'contact'    /** Отправка контакта */
  | 'location'   /** Отправка геолокации */
  | 'selection'  /** Кнопка выбора (multi-select) */
  | 'complete'   /** Кнопка завершения (multi-select done) */
  | 'default'    /** Кнопка по умолчанию */
  | 'copy_text'; /** Копировать текст в буфер обмена (Bot API 7.11, только inline) */

/** Тип кнопки бота из схемы Zod */
export type Button = z.infer<typeof buttonSchema>;

/** Базовые действия кнопок для навигации (подмножество ButtonAction) */
export type ButtonActionCore = Extract<ButtonAction, 'goto' | 'url' | 'command'>;

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
