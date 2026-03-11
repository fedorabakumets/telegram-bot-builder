/**
 * @fileoverview Схема кнопки бота
 * @module shared/schema/tables/button-schema
 */

import { z } from "zod";

/** Схема кнопки бота */
export const buttonSchema = z.object({
  /** Уникальный идентификатор кнопки */
  id: z.string(),
  /** Текст кнопки */
  text: z.string(),
  /** Действие кнопки */
  action: z.enum(['goto', 'command', 'url', 'contact', 'location', 'selection', 'default']),
  /** Целевой узел для перехода */
  target: z.string().optional(),
  /** URL для внешних ссылок */
  url: z.string().optional(),
  /** Запрос контакта пользователя */
  requestContact: z.boolean().optional(),
  /** Запрос геолокации пользователя */
  requestLocation: z.boolean().optional(),
  /** Тип кнопки */
  buttonType: z.enum(['normal', 'option', 'complete']).default('normal'),
  /** Отключить сбор ответов для этой кнопки */
  skipDataCollection: z.boolean().default(false),
  /** Скрыть кнопку после использования */
  hideAfterClick: z.boolean().default(false),
});

/** Тип кнопки бота */
export type Button = z.infer<typeof buttonSchema>;
