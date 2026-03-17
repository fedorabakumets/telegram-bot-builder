/**
 * @fileoverview Zod схема для валидации параметров отправки медиафайлов
 * @module templates/attached-media/attached-media.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров отправки медиафайлов */
export const attachedMediaParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),

  // --- Медиафайлы ---
  /** Массив URL медиафайлов (/uploads/... или http...) */
  attachedMedia: z.array(z.string()).default([]),
  /** Режим форматирования текста */
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),
  /** Тип клавиатуры (влияет на скрытие файлов при наличии кнопок) */
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  /** Контекст обработчика: message или callback */
  handlerContext: z.enum(['message', 'callback']).optional().default('callback'),

  // --- Статическое изображение ---
  /** URL статического изображения из nodeData.imageUrl */
  staticImageUrl: z.string().optional(),

  // --- Динамическое медиа из БД ---
  /** Имя переменной медиа (из mediaVariablesMap) */
  mediaVariable: z.string().optional(),
  /** Тип медиа переменной (photo/video/audio/document) */
  mediaType: z.enum(['photo', 'video', 'audio', 'document']).optional(),

  // --- Автопереход ---
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo: z.string().optional(),

  // --- Waiting state ---
  /** Готовый Python-код установки состояния ожидания (генерируется снаружи) */
  waitingStateCode: z.string().optional(),

  // --- Поведение ---
  /** Обернуть отправку статического изображения в `if not is_fake_callback:` */
  isFakeCallbackCheck: z.boolean().optional().default(false),
  /** Использовать safe_edit_or_send в fallback вместо msg.answer */
  fallbackUseSafeEdit: z.boolean().optional().default(false),
});

/** Тип параметров (выведен из схемы) */
export type AttachedMediaParams = z.infer<typeof attachedMediaParamsSchema>;
