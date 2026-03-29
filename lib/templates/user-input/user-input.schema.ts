/**
 * @fileoverview Zod схема для валидации параметров сбора пользовательского ввода
 * @module templates/user-input/user-input.schema
 */

import { z } from 'zod';

const inputValidationTypeSchema = z.enum(['none', 'email', 'phone', 'number']);
const inputTypeSchema = z.enum(['text', 'button']);
const inputSourceSchema = z.enum(['any', 'text', 'photo', 'video', 'audio', 'document', 'location', 'contact']);
const skipButtonSchema = z.object({ text: z.string(), target: z.string() });

export const userInputParamsSchema = z.object({
  // --- Идентификация ---
  nodeId: z.string(),
  safeName: z.string(),

  // --- Переменная ---
  /** Дефолт 'input' — совпадает с реальным кодом generateHandleNodeFunctions */
  inputVariable: z.string().default('input'),
  appendVariable: z.boolean().optional().default(false),

  // --- Навигация ---
  inputTargetNodeId: z.string().optional().default(''),

  // --- Источник ответа ---
  inputSource: inputSourceSchema.optional(),

  // --- Тип ввода ---
  inputType: inputTypeSchema.optional().default('text'),

  // --- Типы ввода (медиа) ---
  enableTextInput: z.boolean().optional().default(true),
  enablePhotoInput: z.boolean().optional().default(false),
  photoInputVariable: z.string().optional().default(''),
  enableVideoInput: z.boolean().optional().default(false),
  videoInputVariable: z.string().optional().default(''),
  enableAudioInput: z.boolean().optional().default(false),
  audioInputVariable: z.string().optional().default(''),
  enableDocumentInput: z.boolean().optional().default(false),
  documentInputVariable: z.string().optional().default(''),
  enableLocationInput: z.boolean().optional().default(false),
  locationInputVariable: z.string().optional().default(''),
  enableContactInput: z.boolean().optional().default(false),
  contactInputVariable: z.string().optional().default(''),

  // --- Кнопки пропуска ---
  skipButtons: z.array(skipButtonSchema).optional().default([]),

  // --- Валидация ---
  validationType: inputValidationTypeSchema.optional().default('none'),
  minLength: z.number().optional().default(0),
  maxLength: z.number().optional().default(0),

  // --- Сообщения ---
  retryMessage: z.string().optional().default('Пожалуйста, попробуйте еще раз.'),
  successMessage: z.string().optional().default(''),
  inputPrompt: z.string().optional().default(''),
  inputRequired: z.boolean().optional().default(true),

  // --- Сохранение ---
  saveToDatabase: z.boolean().optional().default(true),
});

export type UserInputParams = z.infer<typeof userInputParamsSchema>;
