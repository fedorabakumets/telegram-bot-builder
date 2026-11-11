/**
 * @fileoverview Адресная конфигурация проверок базы данных и хранения версий.
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Каталог проверяемых модулей базы данных. */
const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({ root: dir, test: { environment: 'node', include: ['pool-resilience.test.ts', 'version-object-*.test.ts'] },
  resolve: { alias: { '@shared': path.resolve(dir, '../../shared') } } });
