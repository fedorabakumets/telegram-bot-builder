/**
 * @fileoverview Обработчики API для управления списком ID администраторов бота
 *
 * Источник правды — bot_projects.admin_ids; в .env бота значение попадает при запуске.
 * Чтение старого .env (bots/<папка>/.env) осталось только как запасной вариант для GET.
 *
 * @module adminIdsHandler
 */

import type { Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { storage } from '../../../storages/storage';
import { encodeAdminIdsForStorage, parseAdminIds } from '../../../bots/adminIdsStorage';

/**
 * Находит путь к .env файлу бота по projectId
 */
async function findBotEnvPath(projectId: number): Promise<string | null> {
  const tokens = await storage.getBotTokensByProject(projectId);
  if (!tokens.length) return null;

  const tokenId = tokens[0].id;
  const botsDir = join(process.cwd(), 'bots');

  // Стандартный путь: bots/bot_{projectId}_{tokenId}/.env
  const standardPath = join(botsDir, `bot_${projectId}_${tokenId}`, '.env');
  if (existsSync(standardPath)) return standardPath;

  // Поиск по паттерну с кастомным именем
  const { readdirSync } = await import('fs');
  if (!existsSync(botsDir)) return null;

  const dirs = readdirSync(botsDir, { withFileTypes: true });

  // Сначала ищем по суффиксу _projectId_tokenId
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    if (dir.name.endsWith(`_${projectId}_${tokenId}`)) {
      const envPath = join(botsDir, dir.name, '.env');
      if (existsSync(envPath)) return envPath;
    }
  }

  // Fallback: ищем папку, в .env которой есть BOT_TOKEN совпадающий с токеном проекта
  const token = tokens[0].token;
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const envPath = join(botsDir, dir.name, '.env');
    if (!existsSync(envPath)) continue;
    try {
      const content = readFileSync(envPath, 'utf8');
      if (content.includes(token)) return envPath;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Читает сохранённый список проекта с резервным чтением старого окружения.
 * @param projectId - Идентификатор проекта.
 * @returns Список ID администраторов.
 */
async function loadAdminIds(projectId: number): Promise<string[]> {
  const project = await storage.getBotProject(projectId);
  const saved = project?.adminIds?.trim();
  if (saved) return parseAdminIds(saved);

  const envPath = await findBotEnvPath(projectId);
  if (!envPath) return [];
  const content = readFileSync(envPath, 'utf8');
  const match = content.match(/^ADMIN_IDS=([\s\S]*?)(?=\n[A-Z_]+=|\n#|\s*$)/m);
  return parseAdminIds(match?.[1].replace(/\s+/g, ' ') ?? '');
}

/**
 * Возвращает список администраторов с каноническим представлением пустого списка.
 * @param req - Запрос с идентификатором проекта.
 * @param res - Ответ со списком администраторов.
 * @returns Завершение обработчика.
 */
export async function getAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const ids = await loadAdminIds(projectId);
    res.json({ adminIds: ids.join(','), items: ids.map(id => ({ id })), count: ids.length });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка чтения ADMIN_IDS', error: String(error) });
  }
}

/**
 * Обновляет значение ADMIN_IDS в БД (боты получат его при следующем запуске)
 * @param req - Запрос с params.id (projectId) и body.adminIds
 * @param res - Ответ с сохранённым значением
 */
export async function updateAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    if (typeof req.body?.adminIds !== 'string') {
      res.status(400).json({ message: 'Укажите список администраторов строкой' });
      return;
    }
    const adminIds = parseAdminIds(req.body.adminIds).join(',');
    await storage.updateBotProject(projectId, { adminIds: encodeAdminIdsForStorage(adminIds) });
    res.json({ success: true, adminIds });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления ADMIN_IDS', error: String(error) });
  }
}

/**
 * Удаляет конкретный ID из списка ADMIN_IDS
 * @param req - Запрос с params.id (projectId) и body.adminId (callback_data вида "del_admin_123")
 * @param res - Ответ с обновлённым списком adminIds
 */
export async function removeAdminIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const { adminId } = req.body as { adminId: string };

    // Извлекаем числовой ID из callback_data вида "del_admin_123"
    const cleanId = adminId.replace(/^del_admin_/, '').trim();

    const currentIds = await loadAdminIds(projectId);
    const updatedIds = currentIds.filter(id => id !== cleanId);
    const newAdminIds = updatedIds.join(',');

    if (updatedIds.length !== currentIds.length) {
      await storage.updateBotProject(projectId, { adminIds: encodeAdminIdsForStorage(newAdminIds) });
    }
    res.json({ success: true, adminIds: newAdminIds });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления администратора', error: String(error) });
  }
}
