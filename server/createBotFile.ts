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
 * @returns Путь к созданному файлу бота
 */
export function createBotFile(botCode: string, projectId: number, tokenId?: number): string {
  const botsDir = join(process.cwd(), 'bots');
  if (!existsSync(botsDir)) {
    mkdirSync(botsDir, { recursive: true });
  }

  const fileName = tokenId ? `bot_${projectId}_${tokenId}.py` : `bot_${projectId}.py`;
  const filePath = join(botsDir, fileName);
  writeFileSync(filePath, botCode);
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
 * @returns Объект с путем к основному файлу и массивом путей к сопутствующим файлам
 */
export async function createCompleteBotFiles(
  botCode: string,
  botName: string,
  botData: any,
  projectId: number,
  tokenId: number
): Promise<{ mainFile: string; assets: string[] }> {
  const botsDir = join(process.cwd(), 'bots');

  // Создаем отдельную папку для бота
  const botDir = join(botsDir, `bot_${projectId}_${tokenId}`);
  if (!existsSync(botDir)) {
    mkdirSync(botDir, { recursive: true });
  }

  // Создаем основной файл бота в его папке
  const fileName = `bot_${projectId}_${tokenId}.py`;
  const mainFile = join(botDir, fileName);
  writeFileSync(mainFile, botCode);

  // Динамический импорт генераторов
  const {
    generateRequirementsTxt,
    generateReadme,
    generateDockerfile,
    generateConfigYaml
  } = await import("../client/src/lib/scaffolding");

  // Генерируем и сохраняем дополнительные файлы в папке бота
  const assets: string[] = [];

  // 1. requirements.txt
  const requirementsContent = generateRequirementsTxt();
  const requirementsPath = join(botDir, 'requirements.txt');
  writeFileSync(requirementsPath, requirementsContent);
  assets.push(requirementsPath);

  // 2. README.md
  const readmeContent = generateReadme(botData, botName);
  const readmePath = join(botDir, 'README.md');
  writeFileSync(readmePath, readmeContent);
  assets.push(readmePath);

  // 3. Dockerfile
  const dockerfileContent = generateDockerfile();
  const dockerfilePath = join(botDir, 'Dockerfile');
  writeFileSync(dockerfilePath, dockerfileContent);
  assets.push(dockerfilePath);

  // 4. config.yaml
  const configContent = generateConfigYaml(botName);
  const configPath = join(botDir, 'config.yaml');
  writeFileSync(configPath, configContent);
  assets.push(configPath);

  // 5. JSON файл с данными проекта
  const jsonData = JSON.stringify(botData, null, 2);
  const jsonPath = join(botDir, 'project.json');
  writeFileSync(jsonPath, jsonData);
  assets.push(jsonPath);

  return { mainFile, assets };
}
