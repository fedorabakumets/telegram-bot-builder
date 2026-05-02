/**
 * @fileoverview Zod схема для валидации параметров импортов
 * @module templates/imports/imports.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров импортов */
export const importsParamsSchema = z.object({
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled: z.boolean().default(false),
  /** Есть ли inline кнопки (нужен TelegramBadRequest) */
  hasInlineButtons: z.boolean().default(false),
  /** Есть ли автопереходы (нужен TelegramBadRequest) */
  hasAutoTransitions: z.boolean().default(false),
  /** Есть ли узлы с медиа (нужен aiohttp) */
  hasMediaNodes: z.boolean().default(false),
  /** Есть ли ссылки на /uploads/ (нужен aiohttp) */
  hasUploadImages: z.boolean().default(false),
  /** Есть ли узлы с HTML/Markdown форматированием (нужен ParseMode) */
  hasParseModeNodes: z.boolean().default(false),
  /** Есть ли узлы с группами медиа (attachedMedia.length > 1) */
  hasMediaGroups: z.boolean().default(false),
  /** Есть ли узлы с URL изображениями (imageUrl.startsWith('http')) */
  hasUrlImages: z.boolean().default(false),
  /** Есть ли узлы требующие datetime */
  hasDatetimeNodes: z.boolean().default(false),
  /** Есть ли узлы требующие timezone */
  hasTimezoneNodes: z.boolean().default(false),
  /** Есть ли reply клавиатуры (нужен ReplyKeyboardBuilder, KeyboardButton) */
  hasReplyKeyboard: z.boolean().default(false),
  /** Есть ли локальные медиа файлы (нужен FSInputFile) */
  hasLocalMediaFiles: z.boolean().default(false),
  /** Есть ли команды для BotCommand (нужен BotCommand) */
  hasBotCommands: z.boolean().default(false),
  /** Есть ли deep link триггеры (нужен CommandObject) */
  hasDeepLinkTriggers: z.boolean().default(false),
});

/** Тип параметров импортов (выведен из схемы) */
export type ImportsParams = z.infer<typeof importsParamsSchema>;
