/**
 * @fileoverview Сверяет project.json на диске с данными проекта в БД
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storage } from '../server/storages/storage';

/**
 * SHA256-хеш JSON (первые 16 символов)
 * @param obj - Объект для хеширования
 * @returns Короткий хеш
 */
function shortHash(obj: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

/**
 * Ищет ноду по id во всех листах
 * @param data - Данные сценария
 * @param id - ID ноды
 * @returns Нода или null
 */
function findNode(data: { sheets?: Array<{ nodes?: Array<{ id: string; data?: Record<string, unknown> }> }> }, id: string) {
  for (const sheet of data.sheets || []) {
    for (const node of sheet.nodes || []) {
      if (node.id === id) return node;
    }
  }
  return null;
}

/**
 * Считает листы и ноды
 * @param data - Данные сценария
 * @returns Количество листов и нод
 */
function countNodes(data: { sheets?: Array<{ nodes?: unknown[] }> }) {
  const sheets = (data.sheets || []).length;
  let nodes = 0;
  for (const sheet of data.sheets || []) nodes += (sheet.nodes || []).length;
  return { sheets, nodes };
}

/**
 * Находит project.json в папке bots/
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Путь к файлу
 */
function findProjectJson(projectId: number, tokenId?: number): string {
  const botsDir = path.join(process.cwd(), 'bots');
  const suffix = tokenId ? `_${projectId}_${tokenId}` : `_${projectId}_`;
  const dir = fs.readdirSync(botsDir).find((name) => name.includes(suffix));
  if (!dir) throw new Error(`Папка бота не найдена для projectId=${projectId}`);
  const jsonPath = path.join(botsDir, dir, 'project.json');
  if (!fs.existsSync(jsonPath)) throw new Error(`Файл не найден: ${jsonPath}`);
  return jsonPath;
}

/**
 * Сверяет файл и БД
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 */
async function compare(projectId: number, tokenId?: number): Promise<void> {
  const filePath = findProjectJson(projectId, tokenId);
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const project = await storage.getBotProject(projectId);
  if (!project) throw new Error(`Проект ${projectId} не найден в БД`);

  const dbData = project.data as typeof fileData;
  const fileHash = shortHash(fileData);
  const dbHash = shortHash(dbData);
  const equal = fileHash === dbHash;
  const fc = countNodes(fileData);
  const dc = countNodes(dbData);

  console.log(`=== Сверка FILE vs DB (project ${projectId}) ===`);
  console.log('FILE:', filePath);
  console.log('FILE hash:', fileHash, '| sheets:', fc.sheets, '| nodes:', fc.nodes);
  console.log('DB   hash:', dbHash, '| sheets:', dc.sheets, '| nodes:', dc.nodes);
  console.log('Идентичны:', equal ? 'ДА ✅' : 'НЕТ ❌');

  const checks: Array<[string, unknown, unknown]> = [
    [
      'bot-ub-lucky-token → autoTransitionTo',
      findNode(fileData, 'bot-ub-lucky-token')?.data?.autoTransitionTo,
      findNode(dbData, 'bot-ub-lucky-token')?.data?.autoTransitionTo,
    ],
    [
      'bot-ub-lucky-btc-input → clickValue',
      findNode(fileData, 'bot-ub-lucky-btc-input')?.data?.clickValue,
      findNode(dbData, 'bot-ub-lucky-btc-input')?.data?.clickValue,
    ],
    [
      'bot-split-btc → parallelBranches',
      (findNode(fileData, 'bot-split-btc')?.data?.parallelBranches as unknown[])?.length,
      (findNode(dbData, 'bot-split-btc')?.data?.parallelBranches as unknown[])?.length,
    ],
  ];

  console.log('\n=== Ключевые поля ===');
  for (const [name, fileVal, dbVal] of checks) {
    const ok = JSON.stringify(fileVal) === JSON.stringify(dbVal);
    console.log(`${ok ? 'OK' : 'DIFF'} | ${name}: FILE=${JSON.stringify(fileVal)} DB=${JSON.stringify(dbVal)}`);
  }

  if (!equal) {
    const fileStr = JSON.stringify(fileData);
    const dbStr = JSON.stringify(dbData);
    console.log(`\nРазмер JSON: FILE ${fileStr.length} | DB ${dbStr.length} | delta ${fileStr.length - dbStr.length}`);

    const fileIds = new Set<string>();
    const dbIds = new Set<string>();
    for (const s of fileData.sheets || []) for (const n of s.nodes || []) fileIds.add(n.id);
    for (const s of dbData.sheets || []) for (const n of s.nodes || []) dbIds.add(n.id);
    const onlyFile = [...fileIds].filter((x) => !dbIds.has(x));
    const onlyDb = [...dbIds].filter((x) => !fileIds.has(x));
    if (onlyFile.length) console.log('Только в FILE:', onlyFile.join(', '));
    if (onlyDb.length) console.log('Только в DB:', onlyDb.join(', '));
  }

  process.exit(equal ? 0 : 1);
}

const projectId = parseInt(process.argv[2] || '', 10);
const tokenId = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

if (!projectId) {
  console.error('Использование: npx tsx scripts/compare-bot-project-json.ts <projectId> [tokenId]');
  process.exit(1);
}

compare(projectId, tokenId).catch((err) => {
  console.error(err);
  process.exit(1);
});
