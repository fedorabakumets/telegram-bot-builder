/**
 * @fileoverview Проверяет чтение готового снимка версии через серверное хранилище.
 */
import 'dotenv/config';
import { desc, eq } from 'drizzle-orm';
import { projectVersions } from '@shared/schema';
import { db, pool } from '../server/database/db';
import { readVersionObject } from '../server/database/version-object-store';

/**
 * Читает одну или все версии и проверяет доступность восстановленного JSON.
 * @returns Завершение проверки
 */
async function main(): Promise<void> {
  const all = process.argv.includes('--all');
  const query = db.select().from(projectVersions).where(eq(projectVersions.snapshotState, 'ready'))
    .orderBy(desc(projectVersions.id));
  const rows = all ? await query : await query.limit(1);
  if (rows.length === 0) throw new Error('Перенесённых версий нет');
  for (const row of rows) {
    const snapshot = await readVersionObject(row);
    if (snapshot === null || typeof snapshot !== 'object') throw new Error(`Снимок ${row.id} не является JSON-объектом`);
  }
  console.log(`Прочитано и проверено снимков: ${rows.length}`);
}

main().catch(error => { console.error('Проверка версии не прошла:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
