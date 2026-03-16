/**
 * @fileoverview Zod схема для валидации параметров сообщения
 * @module templates/message/message.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров сообщения */
export const messageParamsSchema = z.object({
  nodeId: z.string(),
  messageText: z.string().optional().default(''),
  isPrivateOnly: z.boolean().optional().default(false),
  adminOnly: z.boolean().optional().default(false),
  requiresAuth: z.boolean().optional().default(false),
  userDatabaseEnabled: z.boolean().optional().default(false),
  allowMultipleSelection: z.boolean().optional().default(false),
  multiSelectVariable: z.string().optional(),
  buttons: z.array(z.any()).optional().default([]),
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  keyboardLayout: z.any().optional(),
  oneTimeKeyboard: z.boolean().optional().default(false),
  resizeKeyboard: z.boolean().optional().default(true),
  enableAutoTransition: z.boolean().optional().default(false),
  autoTransitionTo: z.string().optional(),
  collectUserInput: z.boolean().optional().default(false),
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  attachedMedia: z.array(z.string()).optional().default([]),
  enableConditionalMessages: z.boolean().optional().default(false),
  conditionalMessages: z.array(z.any()).optional().default([]),
  fallbackMessage: z.string().optional(),
  // Поля для сбора пользовательского ввода
  enableTextInput: z.boolean().optional().default(false),
  enablePhotoInput: z.boolean().optional().default(false),
  enableVideoInput: z.boolean().optional().default(false),
  enableAudioInput: z.boolean().optional().default(false),
  enableDocumentInput: z.boolean().optional().default(false),
  inputVariable: z.string().optional(),
  inputTargetNodeId: z.string().optional(),
  minLength: z.number().optional().default(0),
  maxLength: z.number().optional().default(0),
  appendVariable: z.boolean().optional().default(false),
});

/** Тип параметров сообщения (выведен из схемы) */
export type MessageParams = z.infer<typeof messageParamsSchema>;
