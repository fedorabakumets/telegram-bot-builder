/**
 * @fileoverview Модуль для создания файлов Telegram бота
 *
 * Этот файл предоставляет функции для создания файлов бота,
 * включая основной Python-файл и сопутствующие файлы.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildBotEnvContent, getBotEnvSource, parseBotEnv, retireBotEnvFile } from "./botEnv";

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
 * Готовит переменные бота: в режиме file пишет .env, в режиме inline возвращает
 * словарь для команды start_bot и удаляет старый .env из папки.
 * @param botDir - Папка бота
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Путь к .env (file) или словарь переменных (inline)
 */
async function prepareBotEnv(
  botDir: string,
  projectId: number,
  tokenId: number,
): Promise<{ envPath?: string; env?: Record<string, string> }> {
  const content = await buildBotEnvContent(botDir, projectId, tokenId);
  if (getBotEnvSource() === 'inline') {
    await retireBotEnvFile(botDir, projectId);
    return { env: parseBotEnv(content) };
  }
  const envPath = join(botDir, '.env');
  writeFileSync(envPath, content, 'utf8');
  return { envPath };
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
 * @returns Путь к основному файлу, сопутствующие файлы и переменные бота (в режиме inline)
 */
export async function createCompleteBotFiles(
  botCode: string,
  botName: string,
  botData: any,
  projectId: number,
  tokenId: number,
  customFileName?: string,
  options?: CreateCompleteBotFilesOptions,
): Promise<{ mainFile: string; assets: string[]; env?: Record<string, string> }> {
  const { botDir, mainFile } = resolveBotPaths(projectId, tokenId, customFileName);
  if (!existsSync(botDir)) {
    mkdirSync(botDir, { recursive: true });
  }

  const assets: string[] = [];

  if (options?.skipCodeAndData) {
    const { envPath, env } = await prepareBotEnv(botDir, projectId, tokenId);
    if (envPath) assets.push(envPath);
    return { mainFile, assets, env };
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

  const { envPath, env } = await prepareBotEnv(botDir, projectId, tokenId);
  if (envPath) assets.push(envPath);

  return { mainFile, assets, env };
}
