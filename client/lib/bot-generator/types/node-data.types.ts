/**
 * @fileoverview Типы данных узлов бота
 * 
 * Модуль определяет структуру данных для различных типов узлов графа бота.
 * Включает типы для сообщений, команд, медиа, переходов и других элементов.
 * 
 * @module bot-generator/types/node-data.types
 */

import type { Button } from './button-types';

/**
 * Тип клавиатуры для узла
 * 
 * @example
 * const keyboardType: KeyboardType = 'inline';
 */
export type KeyboardType = 'inline' | 'reply' | 'none' | 'remove' | 'default';

/**
 * Режим форматирования текста
 * 
 * @example
 * const formatMode: FormatMode = 'html';
 */
export type FormatMode = 'html' | 'markdown' | 'markdown_v2';

/**
 * Тип ввода данных от пользователя
 * 
 * @example
 * const inputType: InputType = 'text';
 */
export type InputType = 
  | 'text'          /** Текстовый ввод */
  | 'photo'         /** Фотография */
  | 'video'         /** Видео */
  | 'audio'         /** Аудио */
  | 'voice'         /** Голосовое сообщение */
  | 'document'      /** Документ */
  | 'sticker'       /** Стикеры */
  | 'contact'       /** Контакт */
  | 'location'      /** Геолокация */
  | 'poll'          /** Опрос */
  | 'dice'          /** Кубик */
  | 'any';         /** Любой тип */

/**
 * Данные узла бота
 * 
 * @example
 * const data: NodeData = {
 *   text: 'Привет!',
 *   buttons: [],
 *   keyboardType: 'inline'
 * };
 */
export interface NodeData {
  /** Кнопки узла */
  buttons?: Button[];
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Текст сообщения */
  text?: string;
  /** Режим форматирования текста */
  formatMode?: FormatMode;
  /** Использовать Markdown */
  markdown?: boolean;
  
  /** URL изображения */
  imageUrl?: string;
  /** Переменная URL изображения */
  imageUrlVar?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** URL документа */
  documentUrl?: string;
  
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Цель для кнопки продолжения */
  continueButtonTarget?: string;
  
  /** Включить автопереход */
  enableAutoTransition?: boolean;
  /** Цель автоперехода */
  autoTransitionTo?: string;
  
  /** Собирать ввод пользователя */
  collectUserInput?: boolean;
  /** Тип ввода */
  inputType?: InputType;
  /** Цель ввода */
  inputTargetNodeId?: string;
  /** Пропускать сбор данных */
  skipDataCollection?: boolean;
  
  /** Команда узла */
  command?: string;
  /** Описание команды */
  description?: string;
  
  /** Переменные условия */
  conditionalVariables?: Array<{
    variableName: string;
    condition: string;
    value: string;
  }>;
  
  /** Дополнительные поля */
  [key: string]: any;
}
