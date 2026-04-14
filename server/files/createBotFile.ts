/**
 * @fileoverview Модуль для создания файлов Telegram бота
 *
 * Этот файл предоставляет функции для создания файлов бота,
 * включая основной Python-файл и сопутствующие файлы.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
    // Используем кастомное имя файла
    fileName = `${customFileName}.py`;
  } else {
    // Используем стандартное имя файла
    fileName = tokenId ? `bot_${projectId}_${tokenId}.py` : `bot_${projectId}.py`;
  }
  
  const filePath = join(botsDir, fileName);
  writeFileSync(filePath, botCode, 'utf8');
  return filePath;
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
 * @returns Объект с путем к основному файлу и массивом путей к сопутствующим файлам
 */
export async function createCompleteBotFiles(
  botCode: string,
  botName: string,
  botData: any,
  projectId: number,
  tokenId: number,
  customFileName?: string
): Promise<{ mainFile: string; assets: string[] }> {
  const botsDir = join(process.cwd(), 'bots');

  // Создаем отдельную папку для бота
  const folderName = customFileName ? `${customFileName}_${projectId}_${tokenId}` : `bot_${projectId}_${tokenId}`;
  const botDir = join(botsDir, folderName);
  if (!existsSync(botDir)) {
    mkdirSync(botDir, { recursive: true });
  }

  // Нормализуем данные проекта, добавляя все возможные поля условных сообщений
  let normalizedBotData = botData;
  try {
    const { normalizeProjectData } = await import("../utils/normalizeProjectData");
    normalizedBotData = normalizeProjectData({ data: botData })?.data ?? botData;
  } catch (error) {
    console.warn("Не удалось нормализовать данные проекта:", error);
    normalizedBotData = botData;
  }

  // Создаем основной файл бота в его папке
  const fileName = customFileName ? `${customFileName}.py` : `bot_${projectId}_${tokenId}.py`;
  const mainFile = join(botDir, fileName);
  writeFileSync(mainFile, botCode, 'utf8');

  // Динамический импорт генераторов
  const {
    generateRequirementsTxt,
    generateReadme,
    generateDockerfile,
    generateEnvFile
  } = await import("@shared/scaffolding-wrapper");

  // Генерируем и сохраняем дополнительные файлы в папке бота
  const assets: string[] = [];

  // 1. requirements.txt
  const requirementsContent = generateRequirementsTxt();
  const requirementsPath = join(botDir, 'requirements.txt');
  writeFileSync(requirementsPath, requirementsContent, 'utf8');
  assets.push(requirementsPath);

  // 2. README.md
  const readmeContent = generateReadme(normalizedBotData, botName, projectId, tokenId, customFileName);
  const readmePath = join(botDir, 'README.md');
  writeFileSync(readmePath, readmeContent, 'utf8');
  assets.push(readmePath);

  // 3. Dockerfile
  const dockerfileContent = generateDockerfile();
  const dockerfilePath = join(botDir, 'Dockerfile');
  writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
  assets.push(dockerfilePath);

  // 4. JSON файл с данными проекта
  const jsonData = JSON.stringify(normalizedBotData, null, 2);
  const jsonPath = join(botDir, 'project.json');
  writeFileSync(jsonPath, jsonData, 'utf8');
  assets.push(jsonPath);

  // 6. .env файл с токеном бота и ADMIN_IDS
  const { storage } = await import("../storages/storage");
  const tokenRecord = await storage.getBotToken(tokenId);

  // Читаем ADMIN_IDS из БД
  const project = await storage.getBotProject(projectId);
  const dbAdminIds = project?.adminIds?.trim();

  // Fallback: читаем из существующего .env если в БД пусто
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

  const envContent = generateEnvFile(
    tokenRecord?.token || "YOUR_BOT_TOKEN_HERE",
    existingAdminIds,
    projectId,
    tokenRecord?.logLevel || 'WARNING',
    'redis://localhost:6379'
  );
  const envPath = join(botDir, '.env');
  writeFileSync(envPath, envContent, 'utf8');
  assets.push(envPath);

  return { mainFile, assets };
}
