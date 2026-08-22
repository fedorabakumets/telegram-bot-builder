/**
 * @fileoverview Модуль для создания файлов Telegram бота
 *
 * Этот файл предоставляет функции для создания файлов бота,
 * включая основной Python-файл и сопутствующие файлы.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Пути к папке и основному файлу бота */
export interface BotPaths {
  botDir: string;
  mainFile: string;
}

/** Опции createCompleteBotFiles */
export interface CreateCompleteBotFilesOptions {
  /** Не перезаписывать .py, project.json и прочие — только .env */
  skipCodeAndData?: boolean;
}

/**
 * Возвращает пути к папке бота и основному .py без записи на диск.
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param customFileName - Нормализованное имя файла без расширения
 * @returns botDir и mainFile
 */
export function resolveBotPaths(
  projectId: number,
  tokenId: number,
  customFileName?: string,
): BotPaths {
  const botsDir = join(process.cwd(), 'bots');
  const folderName = customFileName
    ? `${customFileName}_${projectId}_${tokenId}`
    : `bot_${projectId}_${tokenId}`;
  const botDir = join(botsDir, folderName);
  const fileName = customFileName
    ? `${customFileName}.py`
    : `bot_${projectId}_${tokenId}.py`;
  const mainFile = join(botDir, fileName);
  return { botDir, mainFile };
}

/**
 * Создает Python файл для бота
 *
 * @param botCode - Код бота на Python
 * @param projectId - Идентификатор проекта
 * @param tokenId - Необязательный идентификатор токена (если указан, используется в имени файла)
 * @param customFileName - Необязательное кастомное имя файла (без расширения .py)
 * @returns Путь к созданному файлу бота
 */
export function createBotFile(botCode: string, projectId: number, tokenId?: number, customFileName?: string): string {
  const botsDir = join(process.cwd(), 'bots');
  if (!existsSync(botsDir)) {
    mkdirSync(botsDir, { recursive: true });
  }

  let fileName: string;
  if (customFileName) {
    fileName = `${customFileName}.py`;
  } else {
    fileName = tokenId ? `bot_${projectId}_${tokenId}.py` : `bot_${projectId}.py`;
  }

  const filePath = join(botsDir, fileName);
  writeFileSync(filePath, botCode, 'utf8');
  return filePath;
}

/**
 * Записывает только .env в папку бота (актуальные токен, Redis, webhook).
 * @param botDir - Папка бота
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Путь к .env
 */
async function writeBotEnvFile(
  botDir: string,
  projectId: number,
  tokenId: number,
): Promise<string> {
  const { generateEnvFile } = await import("@shared/scaffolding-wrapper");
  const { storage } = await import("../storages/storage");
  const tokenRecord = await storage.getBotToken(tokenId);
  const project = await storage.getBotProject(projectId);
  const dbAdminIds = project?.adminIds?.trim();

  let existingAdminIds = dbAdminIds || '123456789';
  if (!dbAdminIds) {
    const existingEnvPath = join(botDir, '.env');
    if (existsSync(existingEnvPath)) {
      try {
        const { readFileSync } = await import('node:fs');
        const existingEnv = readFileSync(existingEnvPath, 'utf8');
        const match = existingEnv.match(/^ADMIN_IDS=(.+)$/m);
        if (match && match[1].trim()) {
          existingAdminIds = match[1].trim();
        }
      } catch {
        // ignore
      }
    }
  }

  const launchMode = tokenRecord?.launchMode ?? 'polling';
  const webhookBaseUrl = tokenRecord?.webhookBaseUrl ?? null;
  const webhookPort = launchMode === 'webhook' && webhookBaseUrl ? 9000 + tokenId : null;
  const protectContent = tokenRecord?.protectContent === 1;
  const saveIncomingMedia = tokenRecord?.saveIncomingMedia === 1;
  const catchAllHandlers = tokenRecord?.catchAllHandlers !== 0;
  const contentCache = tokenRecord?.contentCache === 1;

  const customEnvVars = await storage.getEnvVariables(tokenId);
  const customVariables = customEnvVars.map(v => ({
    key: v.key,
    value: v.value.startsWith('${{') && v.value.endsWith('}}')
      ? (process.env[v.value.slice(3, -2)] ?? v.value)
      : v.value,
  }));

  if (!customVariables.some(v => v.key === 'DATABASE_URL') && process.env.DATABASE_URL) {
    customVariables.push({ key: 'DATABASE_URL', value: process.env.DATABASE_URL });
  }
  if (!customVariables.some(v => v.key === 'REDIS_URL') && process.env.REDIS_URL) {
    customVariables.push({ key: 'REDIS_URL', value: process.env.REDIS_URL });
  }

  if (tokenRecord?.userbotEnabled === 1) {
    if (tokenRecord.userbotApiId) {
      customVariables.push({ key: 'USERBOT_API_ID', value: tokenRecord.userbotApiId });
    }
    if (tokenRecord.userbotApiHash) {
      customVariables.push({ key: 'USERBOT_API_HASH', value: tokenRecord.userbotApiHash });
    }
    if (tokenRecord.userbotSessionString) {
      customVariables.push({ key: 'USERBOT_SESSION_STRING', value: tokenRecord.userbotSessionString });
    }
  }

  const envContent = generateEnvFile(
    tokenRecord?.token || "YOUR_BOT_TOKEN_HERE",
    existingAdminIds,
    projectId,
    tokenRecord?.logLevel || 'WARNING',
    'redis://localhost:6379',
    launchMode === 'webhook' ? webhookBaseUrl : null,
    webhookPort,
    protectContent,
    saveIncomingMedia,
    tokenId,
    customVariables,
    catchAllHandlers,
    contentCache,
  );
  const envPath = join(botDir, '.env');
  writeFileSync(envPath, envContent, 'utf8');
  return envPath;
}

/**
 * Создает полный набор файлов для бота (основной файл + сопутствующие)
 *
 * @param botCode - Код бота на Python
 * @param botName - Имя бота
 * @param botData - Данные проекта бота
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param customFileName - Необязательное кастомное имя файла (без расширения .py)
 * @param options - skipCodeAndData: только .env, не трогать .py
 * @returns Объект с путем к основному файлу и массивом путей к сопутствующим файлам
 */
export async function createCompleteBotFiles(
  botCode: string,
  botName: string,
  botData: any,
  projectId: number,
  tokenId: number,
  customFileName?: string,
  options?: CreateCompleteBotFilesOptions,
): Promise<{ mainFile: string; assets: string[] }> {
  const { botDir, mainFile } = resolveBotPaths(projectId, tokenId, customFileName);
  if (!existsSync(botDir)) {
    mkdirSync(botDir, { recursive: true });
  }

  const assets: string[] = [];

  if (options?.skipCodeAndData) {
    const envPath = await writeBotEnvFile(botDir, projectId, tokenId);
    assets.push(envPath);
    return { mainFile, assets };
  }

  let normalizedBotData = botData;
  try {
    const { normalizeProjectData } = await import("../utils/normalizeProjectData");
    normalizedBotData = normalizeProjectData({ data: botData })?.data ?? botData;
  } catch (error) {
    console.warn("Не удалось нормализовать данные проекта:", error);
    normalizedBotData = botData;
  }

  writeFileSync(mainFile, botCode, 'utf8');

  const {
    generateRequirementsTxt,
    generateReadme,
    generateDockerfile,
  } = await import("@shared/scaffolding-wrapper");

  const requirementsPath = join(botDir, 'requirements.txt');
  writeFileSync(requirementsPath, generateRequirementsTxt(), 'utf8');
  assets.push(requirementsPath);

  const readmePath = join(botDir, 'README.md');
  writeFileSync(
    readmePath,
    generateReadme(normalizedBotData, botName, projectId, tokenId, customFileName),
    'utf8',
  );
  assets.push(readmePath);

  const dockerfilePath = join(botDir, 'Dockerfile');
  writeFileSync(dockerfilePath, generateDockerfile(), 'utf8');
  assets.push(dockerfilePath);

  const jsonPath = join(botDir, 'project.json');
  writeFileSync(jsonPath, JSON.stringify(normalizedBotData, null, 2), 'utf8');
  assets.push(jsonPath);

  const envPath = await writeBotEnvFile(botDir, projectId, tokenId);
  assets.push(envPath);

  return { mainFile, assets };
}
