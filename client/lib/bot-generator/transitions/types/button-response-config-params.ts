/**
 * @fileoverview Параметры для генерации конфигурации кнопочного ответа
 * Используется в generateButtonResponseConfig
 */

import type { Connection } from '../../node-navigation/utils/navigation-helpers';
import type { ResponseOption } from './button-response-config-types';

/**
 * Параметры для генерации конфигурации кнопочного ответа
 */
export interface ButtonResponseConfigParams {
  /** Узел с данными ответа */
  node: {
    /** ID узла */
    id: string;
    /** Данные узла */
    data: {
      /** Текст сообщения или подсказки */
      messageText?: string;
      /** Подсказка ввода */
      inputPrompt?: string;
      /** Переменная для сохранения */
      inputVariable?: string;
      /** Таймаут ввода (секунды) */
      inputTimeout?: number;
      /** Сохранять в базу данных */
      saveToDatabase?: boolean;
      /** Разрешить множественный выбор */
      allowMultipleSelection?: boolean;
      /** Разрешить пропуск */
      allowSkip?: boolean;
      /** Варианты ответов */
      responseOptions?: ResponseOption[];
    };
  };
  /** Массив всех ID узлов */
  allNodeIds: string[];
  /** Массив соединений */
  connections: Connection[];
  /** Отступ для форматирования */
  indent?: string;
}
