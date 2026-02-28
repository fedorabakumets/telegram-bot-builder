/**
 * @fileoverview Типы для кнопок бота
 * Определяет структуру данных для кнопок клавиатуры
 */

import { z } from 'zod';
import { buttonSchema } from '@shared/schema';

/** Тип кнопки бота */
export type Button = z.infer<typeof buttonSchema>;

/** Интерфейс для опции ответа */
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
