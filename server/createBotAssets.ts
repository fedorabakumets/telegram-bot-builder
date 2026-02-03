/**
 * @fileoverview Модуль для создания дополнительных файлов бота
 *
 * Этот файл предоставляет функции для создания сопутствующих файлов бота,
 * таких как requirements.txt, README.md, Dockerfile, config.yaml и JSON-файл с данными проекта.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Создает все дополнительные файлы для бота
 *
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param botName - Имя бота
 * @param botData - Данные проекта бота
 * @returns Массив путей к созданным файлам
 */
export async function createBotAssets(
  projectId: number,
  tokenId: number,
  botName: string,
  botData: any
): Promise<string[]> {
  const botsDir = join(process.cwd(), 'bots');
  if (!existsSync(botsDir)) {
    mkdirSync(botsDir, { recursive: true });
  }

  // Динамический импорт генераторов
  const {
    generateRequirementsTxt,
    generateReadme,
    generateDockerfile,
    generateConfigYaml
  } = await import("../client/src/lib/scaffolding");

  const baseFileName = `bot_${projectId}_${tokenId}`;
  const botDir = join(botsDir, baseFileName);

  // Создаем подкаталог для бота, если нужно организовать файлы отдельно
  if (!existsSync(botDir)) {
    mkdirSync(botDir, { recursive: true });
  }

  // Генерируем и сохраняем дополнительные файлы
  const assetsPaths: string[] = [];

  // 1. requirements.txt
  const requirementsContent = generateRequirementsTxt();
  const requirementsPath = join(botsDir, `requirements_${projectId}_${tokenId}.txt`);
  writeFileSync(requirementsPath, requirementsContent);
  assetsPaths.push(requirementsPath);

  // 2. README.md
  const readmeContent = generateReadme(botData, botName);
  const readmePath = join(botsDir, `README_${projectId}_${tokenId}.md`);
  writeFileSync(readmePath, readmeContent);
  assetsPaths.push(readmePath);

  // 3. Dockerfile
  const dockerfileContent = generateDockerfile();
  const dockerfilePath = join(botsDir, `Dockerfile_${projectId}_${tokenId}`);
  writeFileSync(dockerfilePath, dockerfileContent);
  assetsPaths.push(dockerfilePath);

  // 4. config.yaml
  const configContent = generateConfigYaml(botName);
  const configPath = join(botsDir, `config_${projectId}_${tokenId}.yaml`);
  writeFileSync(configPath, configContent);
  assetsPaths.push(configPath);

  // 5. JSON файл с данными проекта
  const jsonData = JSON.stringify(botData, null, 2);
  const jsonPath = join(botsDir, `project_${projectId}_${tokenId}.json`);
  writeFileSync(jsonPath, jsonData);
  assetsPaths.push(jsonPath);

  return assetsPaths;
}