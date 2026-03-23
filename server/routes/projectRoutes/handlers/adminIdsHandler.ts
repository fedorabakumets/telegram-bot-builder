/**
 * @fileoverview Обработчики API для управления списком ID администраторов бота
 *
 * Читает и обновляет переменную ADMIN_IDS в файле .env бота.
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
 * Читает значение ADMIN_IDS из .env файла бота
 */
export async function getAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const envPath = await findBotEnvPath(projectId);

    if (!envPath) {
      res.json({ adminIds: '' });
      return;
    }

    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^ADMIN_IDS=(.*)$/m);
    res.json({ adminIds: match ? match[1].trim() : '' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка чтения ADMIN_IDS', error: String(error) });
  }
}

/**
 * Обновляет значение ADMIN_IDS в .env файле бота
 */
export async function updateAdminIdsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);
    const { adminIds } = req.body as { adminIds: string };

    const envPath = await findBotEnvPath(projectId);
    if (!envPath) {
      res.status(404).json({ message: 'Файл .env бота не найден. Сначала запустите бота.' });
      return;
    }

    let content = readFileSync(envPath, 'utf8');

    if (/^ADMIN_IDS=/m.test(content)) {
      content = content.replace(/^ADMIN_IDS=.*$/m, `ADMIN_IDS=${adminIds}`);
    } else {
      content += `\nADMIN_IDS=${adminIds}`;
    }

    writeFileSync(envPath, content, 'utf8');
    res.json({ success: true, adminIds });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления ADMIN_IDS', error: String(error) });
  }
}
