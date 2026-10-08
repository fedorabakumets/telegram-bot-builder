/**
 * @fileoverview Регистрация настройки и авторизации Telethon Userbot в MCP.
 * @module lib/bot-tools/mcp-register-userbot-tools
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { setUserbotSettingsInDb } from './userbot-settings-db.ts';
import { sendUserbotCodeInDb, signInUserbotInDb, signInUserbot2faInDb } from './userbot-auth-db.ts';
import type { UserbotResult } from './userbot-request-db.ts';

/** Общие идентификаторы операции */
const ids = {
  /** Идентификатор проекта */
  project_id: z.number().int().positive().describe('ID проекта'),
  /** Идентификатор токена */
  token_id: z.number().int().positive().describe('ID токена из db_list_bot_tokens'),
};

/**
 * Упаковывает безопасный результат в формат MCP.
 * @param result - Статус операции
 * @returns Текстовый ответ MCP
 */
function textResult(result: UserbotResult) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

/**
 * Добавляет четыре инструмента в общий сервер обоих транспортов.
 * @param server - MCP-сервер конструктора
 * @returns Ничего
 */
export function registerUserbotTools(server: McpServer): void {
  server.registerTool('db_set_userbot_settings', {
    description: 'Настроить Telethon Userbot. Пропущенные поля не меняются; пустые и замаскированные секреты сохраняются. Настройки применятся при следующем запуске бота; автоматического перезапуска нет.',
    inputSchema: {
      ...ids,
      enabled: z.union([z.literal(0), z.literal(1)]).describe('Включить режим: 0 или 1'),
      api_id: z.string().nullable().optional().describe('API ID; null или пустая строка очищают значение'),
      api_hash: z.string().nullable().optional().describe('API Hash; null, пустая строка или маска сохраняют секрет'),
      session_string: z.string().nullable().optional().describe('Готовая сессия; null, пустая строка или маска сохраняют секрет'),
    },
  }, async ({ project_id, token_id, ...settings }) => textResult(await setUserbotSettingsInDb(project_id, token_id, settings)));
  server.registerTool('db_userbot_send_code', {
    description: 'Шаг 1: отправить код входа Telethon. Без api_hash используется сохранённый API Hash. Сначала сохраните API ID и Hash через db_set_userbot_settings; затем вызовите db_userbot_sign_in для того же токена.',
    inputSchema: {
      ...ids,
      api_id: z.string().trim().min(1).describe('API ID приложения Telegram'),
      phone: z.string().trim().min(1).describe('Телефон аккаунта с кодом страны'),
      api_hash: z.string().optional().describe('API Hash; можно пропустить, если сохранён'),
    },
  }, async ({ project_id, token_id, ...input }) => textResult(await sendUserbotCodeInDb(project_id, token_id, input)));
  server.registerTool('db_userbot_sign_in', {
    description: 'Шаг 2: вход по коду после db_userbot_send_code. При needs_2fa=true вызовите db_userbot_sign_in_2fa. Успешный вход сохраняет сессию и включает режим; затем нужен запуск или перезапуск бота.',
    inputSchema: {
      ...ids,
      phone: z.string().trim().min(1).describe('Телефон из шага отправки кода'),
      code: z.string().trim().min(1).describe('Код входа из Telegram'),
    },
  }, async ({ project_id, token_id, phone, code }) => textResult(await signInUserbotInDb(project_id, token_id, phone, code)));
  server.registerTool('db_userbot_sign_in_2fa', {
    description: 'Шаг 3: пароль 2FA после needs_2fa=true. Сессия сохраняется сервером, режим включается. Для применения нужен запуск или перезапуск бота; автоматически он не выполняется.',
    inputSchema: { ...ids, password: z.string().min(1).describe('Пароль второго фактора Telegram') },
  }, async ({ project_id, token_id, password }) => textResult(await signInUserbot2faInDb(project_id, token_id, password)));
}
