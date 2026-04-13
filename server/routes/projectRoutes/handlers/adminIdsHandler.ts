/**
 * @fileoverview Обработчики API для управления списком ID администраторов бота
 *
 * Читает, обновляет и удаляет записи в переменной ADMIN_IDS файла .env бота.
 * Файл .env находится в папке bots/bot_{projectId}_{tokenId}/.env
 *
 * @module adminIdsHandler
 */

import type { Request, Response } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { storage } from '../../../storages/storage';

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
 * Читает значение ADMIN_IDS из БД (с fallback на .env файл)
 */
export async function getAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);

    // Сначала читаем из БД
    const project = await storage.getBotProject(projectId);
    if (project?.adminIds?.trim()) {
      const raw = project.adminIds.trim();
      const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
      res.json({ adminIds: raw, items: ids.map(id => ({ id })), count: ids.length });
      return;
    }

    // Fallback: читаем из .env файла
    const envPath = await findBotEnvPath(projectId);
    if (!envPath) {
      res.json({ adminIds: '', items: [], count: 0 });
      return;
    }

    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^ADMIN_IDS=([\s\S]*?)(?=\n[A-Z_]+=|\n#|\s*$)/m);
    const raw = match ? match[1].replace(/\s+/g, ' ').trim() : '';
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    res.json({ adminIds: raw, items: ids.map(id => ({ id })), count: ids.length });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка чтения ADMIN_IDS', error: String(error) });
  }
}

/**
 * Обновляет значение ADMIN_IDS в БД и .env файле бота
 */
export async function updateAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const { adminIds } = req.body as { adminIds: string };

    // 1. Сохраняем в БД
    await storage.updateBotProject(projectId, { adminIds });

    // 2. Также пишем в .env файл (если он существует)
    const envPath = await findBotEnvPath(projectId);
    if (envPath) {
      let content = readFileSync(envPath, 'utf8');
      if (/^ADMIN_IDS=/m.test(content)) {
        content = content.replace(/^ADMIN_IDS=.*(\n[ \t]+.*)*$/m, `ADMIN_IDS=${adminIds}`);
      } else {
        content += `\nADMIN_IDS=${adminIds}`;
      }
      writeFileSync(envPath, content, 'utf8');
    }

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

    const project = await storage.getBotProject(projectId);
    const currentIds = (project?.adminIds ?? '').split(',').map(s => s.trim()).filter(Boolean);
    const updatedIds = currentIds.filter(id => id !== cleanId);
    const newAdminIds = updatedIds.join(',');

    // Сохраняем в БД
    await storage.updateBotProject(projectId, { adminIds: newAdminIds });

    // Обновляем .env файл если существует
    const envPath = await findBotEnvPath(projectId);
    if (envPath) {
      let content = readFileSync(envPath, 'utf8');
      if (/^ADMIN_IDS=/m.test(content)) {
        content = content.replace(/^ADMIN_IDS=.*(\n[ \t]+.*)*$/m, `ADMIN_IDS=${newAdminIds}`);
      } else {
        content += `\nADMIN_IDS=${newAdminIds}`;
      }
      writeFileSync(envPath, content, 'utf8');
    }

    res.json({ success: true, adminIds: newAdminIds });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления администратора', error: String(error) });
  }
}
