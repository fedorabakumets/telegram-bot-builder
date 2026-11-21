/** @fileoverview Проверка параметров публичного API Telegram-аккаунтов. */
import { z } from 'zod';

/** Идентификаторы принимаются только в десятичном виде без дробной части. */
export const projectTelegramAccountPathId = z.string().regex(/^[1-9]\d*$/)
  .transform(Number).pipe(z.number().int().positive().max(2_147_483_647));

/** Поля новой карточки аккаунта. */
export const newProjectTelegramAccount = z.object({ name: z.string().trim().min(1).max(100) }).strict();

/** Полный набор ботов аккаунта. */
export const projectTelegramAccountBots = z.object({
  botIds: z.array(z.number().int().positive().max(2_147_483_647)).max(1_000),
}).strict();

/** Настройка прокси, отправляемая владельцем проекта. */
const proxy = z.object({
  type: z.enum(['socks5', 'http']),
  host: z.string().trim().min(1).max(253).regex(/^[\w.:-]+$/),
  port: z.number().int().min(1).max(65_535),
  username: z.string().max(255).optional(),
  password: z.string().max(255).optional(),
}).strict();

/** Пустое значение отключает и удаляет сохранённый прокси. */
export const projectTelegramAccountProxy = z.object({ proxy: proxy.nullable() }).strict();
