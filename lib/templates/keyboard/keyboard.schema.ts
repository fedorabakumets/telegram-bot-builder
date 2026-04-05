/**
 * @fileoverview Zod схема для валидации параметров клавиатуры
 * @module templates/keyboard/keyboard.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров клавиатуры */
export const keyboardParamsSchema = z.object({
  // --- Тип и кнопки ---
  /** Тип клавиатуры */
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  /** Кнопки */
  buttons: z.array(z.object({
    id: z.string(),
    text: z.string(),
    action: z.string(),
    target: z.string().optional(),
    url: z.string().optional(),
    requestContact: z.boolean().optional(),
    requestLocation: z.boolean().optional(),
    /** Пользовательский callback_data */
    customCallbackData: z.string().optional(),
    /** Текст для копирования в буфер обмена (только для copy_text) */
    copyText: z.string().optional(),
    /** URL для Telegram Mini App (только для web_app, требует HTTPS) */
    webAppUrl: z.string().optional(),
    /** Визуальный стиль кнопки (Bot API 9.4): primary=синий, success=зелёный, danger=красный */
    style: z.enum(['primary', 'success', 'danger']).optional(),
    /** Предложенное имя для создаваемого управляемого бота (Bot API 9.6) */
    suggestedBotName: z.string().optional(),
    /** Предложенный username для создаваемого управляемого бота (Bot API 9.6) */
    suggestedBotUsername: z.string().optional(),
  })).default([]),
  /** Раскладка клавиатуры */
  keyboardLayout: z.object({
    rows: z.array(z.object({ buttonIds: z.array(z.string()) })),
    columns: z.number(),
    autoLayout: z.boolean(),
  }).optional(),
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard: z.boolean().optional().default(false),
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard: z.boolean().optional(),

  // --- Множественный выбор ---
  /** Разрешить множественный выбор */
  allowMultipleSelection: z.boolean().optional().default(false),
  /** Переменная для хранения выборов */
  multiSelectVariable: z.string().optional(),
  /** ID узла для callback_data */
  nodeId: z.string().optional(),
  /** Кнопка завершения выбора */
  completeButton: z.object({
    text: z.string(),
    target: z.string(),
  }).optional(),

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages: z.boolean().optional().default(false),
  /** Массив условий */
  conditionalMessages: z.array(z.object({
    variable: z.string(),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than']),
    value: z.string(),
    message: z.string(),
    keyboard: z.string().optional(),
  })).optional(),
  /** Переменная условной клавиатуры */
  conditionalKeyboardVar: z.string().optional(),

  // --- Медиа ---
  /** Есть ли изображение */
  hasImage: z.boolean().optional().default(false),
  /** URL изображения */
  imageUrl: z.string().optional(),
  /** URL документа */
  documentUrl: z.string().optional(),
  /** URL видео */
  videoUrl: z.string().optional(),
  /** URL аудио */
  audioUrl: z.string().optional(),

  // --- Форматирование ---
  /** Режим форматирования */
  parseMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),

  // --- Служебные ---
  /** Уровень отступа */
  indentLevel: z.string().optional().default(''),
  /** Массив всех ID узлов */
  allNodeIds: z.array(z.string()).optional().default([]),
});

export type KeyboardParams = z.infer<typeof keyboardParamsSchema>;
