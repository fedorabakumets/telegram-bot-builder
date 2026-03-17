/**
 * @fileoverview Zod схема для валидации параметров сбора пользовательского ввода
 * @module templates/user-input/user-input.schema
 */

import { z } from 'zod';

const inputValidationTypeSchema = z.enum(['none', 'email', 'phone', 'number']);

export const userInputParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),
  /** Безопасное имя функции */
  safeName: z.string(),

  // --- Переменная ---
  /** Имя переменной для сохранения ответа */
  inputVariable: z.string().default('user_response'),
  /** Режим добавления (не перезаписывать) */
  appendVariable: z.boolean().optional().default(false),

  // --- Навигация ---
  /** ID следующего узла после ввода */
  inputTargetNodeId: z.string().optional().default(''),

  // --- Типы ввода ---
  /** Принимать текстовый ввод */
  enableTextInput: z.boolean().optional().default(true),
  /** Принимать фото */
  enablePhotoInput: z.boolean().optional().default(false),
  /** Переменная для фото */
  photoInputVariable: z.string().optional().default(''),
  /** Принимать видео */
  enableVideoInput: z.boolean().optional().default(false),
  /** Переменная для видео */
  videoInputVariable: z.string().optional().default(''),
  /** Принимать аудио */
  enableAudioInput: z.boolean().optional().default(false),
  /** Переменная для аудио */
  audioInputVariable: z.string().optional().default(''),
  /** Принимать документы */
  enableDocumentInput: z.boolean().optional().default(false),
  /** Переменная для документов */
  documentInputVariable: z.string().optional().default(''),

  // --- Валидация ---
  /** Тип валидации */
  validationType: inputValidationTypeSchema.optional().default('none'),
  /** Минимальная длина текста */
  minLength: z.number().optional().default(0),
  /** Максимальная длина текста */
  maxLength: z.number().optional().default(0),

  // --- Сообщения ---
  /** Сообщение при ошибке валидации */
  retryMessage: z.string().optional().default('Пожалуйста, попробуйте еще раз.'),
  /** Сообщение при успешном сохранении */
  successMessage: z.string().optional().default(''),

  // --- Сохранение ---
  /** Сохранять в базу данных */
  saveToDatabase: z.boolean().optional().default(true),
});

export type UserInputParams = z.infer<typeof userInputParamsSchema>;
