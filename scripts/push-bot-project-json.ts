/**
 * @fileoverview Загружает project.json из папки bots/ в БД по ID проекта
 */
import fs from 'fs';
import path from 'path';
import { storage } from '../server/storages/storage';
import { syncContentToTable } from '../server/services/content-table';

/**
 * Находит папку бота по ID проекта и токена
 * @param projectId - ID проекта
 * @param tokenId - ID токена (опционально)
 * @returns Абсолютный путь к project.json
 */
function findProjectJson(projectId: number, tokenId?: number): string {
  const botsDir = path.join(process.cwd(), 'bots');
  const suffix = tokenId ? `_${projectId}_${tokenId}` : `_${projectId}_`;
  const dir = fs.readdirSync(botsDir).find((name) => name.includes(suffix));
  if (!dir) {
    throw new Error(`Папка бота не найдена для projectId=${projectId}`);
  }
  const jsonPath = path.join(botsDir, dir, 'project.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Файл не найден: ${jsonPath}`);
  }
  return jsonPath;
}

/**
 * Сохраняет project.json в БД
 * @param projectId - ID проекта
 * @param tokenId - ID токена (опционально)
 */
async function pushProjectJson(projectId: number, tokenId?: number): Promise<void> {
  const jsonPath = findProjectJson(projectId, tokenId);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const updated = await storage.updateBotProject(projectId, { data });
  if (!updated) {
    throw new Error(`Проект ${projectId} не найден в БД`);
  }
  await syncContentToTable(projectId, data);
  try {
    const { getRedisPublisher } = await import('../server/redis/redisClient');
    const pub = getRedisPublisher();
    if (pub) {
      await pub.publish(`bot:table_updated:${projectId}`, 'reload');
    }
  } catch {
    /* Redis опционален при локальном push */
  }
  console.log(`OK: project ${projectId} обновлён из ${jsonPath}`);

  const { restartBotIfRunning } = await import('../server/bots/restartBotIfRunning');
  const restart = await restartBotIfRunning(projectId);
  if (restart.success) {
    console.log(`OK: бот project ${projectId} перезапущен`);
  } else if (restart.error) {
    console.log(`ℹ️ перезапуск: ${restart.error}`);
  }
}

const projectId = parseInt(process.argv[2] || '', 10);
const tokenId = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

if (!projectId) {
  console.error('Использование: npx tsx scripts/push-bot-project-json.ts <projectId> [tokenId]');
  process.exit(1);
}

pushProjectJson(projectId, tokenId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
