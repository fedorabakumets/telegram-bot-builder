/** @fileoverview Запускает изолированный стресс инициализации с настоящим сгенерированным Python-кодом. */
import { spawnSync } from 'node:child_process';
import { generateConfig } from '../lib/templates/config/config.renderer';
import { generateDatabase } from '../lib/templates/database/database.renderer';

/** Число циклов на каждого из сорока независимых ботов. */
const cycles = Number(process.argv[2] ?? 1000);
if (!Number.isSafeInteger(cycles) || cycles < 1) throw new Error('Число циклов должно быть положительным');
/** Результат исполнения использует только локальные поддельные соединения. */
const result = spawnSync('python', ['tools/runtime_resource_init_stress.py', String(cycles)], {
  input: JSON.stringify({ config: generateConfig({ userDatabaseEnabled: true, projectId: 1 }),
    database: generateDatabase({ userDatabaseEnabled: true }) }),
  encoding: 'utf8', timeout: 180_000,
});
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
