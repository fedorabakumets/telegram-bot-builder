/**
 * @fileoverview Выгружает project.json из БД в папку bots/
 */
import fs from 'fs';
import path from 'path';
import { storage } from '../server/storages/storage';

/**
 * Находит папку бота по ID проекта
 * @param projectId - ID проекта
 * @param tokenId - ID токена (опционально)
 * @returns Абсолютный путь к project.json
 */
function findProjectJson(projectId: number, tokenId?: number): string {
  const botsDir = path.join(process.cwd(), 'bots');
  const suffix = tokenId ? `_${projectId}_${tokenId}` : `_${projectId}_`;
  const dir = fs.readdirSync(botsDir).find((name) => name.includes(suffix));
  if (!dir) throw new Error(`Папка бота не найдена для projectId=${projectId}`);
  return path.join(botsDir, dir, 'project.json');
}

/**
 * Сохраняет данные проекта из БД в project.json
 * @param projectId - ID проекта
 * @param tokenId - ID токена (опционально)
 */
async function pullProjectJson(projectId: number, tokenId?: number): Promise<void> {
  const project = await storage.getBotProject(projectId);
  if (!project?.data) throw new Error(`Проект ${projectId} не найден в БД`);
  const jsonPath = findProjectJson(projectId, tokenId);
  fs.writeFileSync(jsonPath, JSON.stringify(project.data, null, 2), 'utf8');
  console.log(`OK: project ${projectId} выгружен в ${jsonPath}`);
}

const projectId = parseInt(process.argv[2] || '', 10);
const tokenId = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

if (!projectId) {
  console.error('Использование: npx tsx scripts/pull-bot-project-json.ts <projectId> [tokenId]');
  process.exit(1);
}

pullProjectJson(projectId, tokenId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
