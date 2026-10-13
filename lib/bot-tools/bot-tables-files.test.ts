/**
 * @fileoverview Запрет ссылок и чужих путей, превью импорта без сети
 * @module lib/bot-tools/bot-tables-files.test
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { importProjectTables } from './bot-tables-files.ts';
import { resolveTableReadPath } from './bot-tables-paths.ts';

vi.mock('./api-fetch.ts', () => ({
  apiFetch: vi.fn(() => {
    throw new Error('сеть не должна вызываться');
  }),
  resolveMcpAgentToken: () => undefined,
}));

describe('файлы таблиц', () => {
  it('читает файл из временной папки и отклоняет ссылку', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tables-read-'));
    const file = path.join(dir, 'rows.csv');
    fs.writeFileSync(file, 'a\n1\n');
    expect(resolveTableReadPath(file)).toBe(fs.realpathSync(file));
    const link = path.join(dir, 'link.csv');
    fs.symlinkSync(file, link);
    expect(resolveTableReadPath(link)).toEqual({ error: 'Ссылки запрещены' });
  });

  it('не открывает файл вне рабочего и временного каталога', () => {
    const outside = '/etc/hostname';
    if (!fs.existsSync(outside)) return;
    const resolved = resolveTableReadPath(outside);
    expect(resolved).toEqual({ error: 'Путь вне рабочего каталога и временной папки' });
  });

  it('показывает превью замены и не вызывает API без confirm', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tables-json-'));
    const file = path.join(dir, 'all.json');
    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      tables: [{ name: 'Товары', columns: ['имя'], rows: [['хлеб']] }],
    }));
    const preview = await importProjectTables(1, file, 'replace', false);
    expect(preview).toMatchObject({ needs_confirm: true, preview: [{ name: 'Товары', rows: 1 }] });
  });
});
