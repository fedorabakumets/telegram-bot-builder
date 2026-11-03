/** @fileoverview Проверка автономного архива и отказа при неполном оригинале. */
import { describe, it, expect, vi } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { Readable } from 'node:stream';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generatePythonCode } from '../../../../lib/bot-generator';

vi.mock('../../../storages/storage', () => ({ storage: {
  getMediaFilesByUrls: async (urls: string[], projectId: number) => urls.filter(url => !url.includes('external.test')).map(url => ({ url, projectId })),
} }));
vi.mock('../../../storage/resolve-runtime-media', () => ({
  resolveRuntimeMedia: async (projectId: number, url: string) => {
    if (url.includes('external.test')) throw Object.assign(new Error('Внешний URL'), { code: 'MEDIA_NOT_MANAGED' });
    if (projectId !== 12 || url.startsWith('/uploads/13/')) throw new Error('Нет доступа');
    return { url };
  },
  openRuntimeMedia: async (entry: { url: string }) => ({
    size: entry.url.endsWith('broken.jpg') ? 5 : 3,
    version: 'v1',
    stream: async () => Readable.from([Buffer.from('abc')]),
  }),
}));

import { exportProjectArchive, prepareArchiveMedia } from './exportProjectArchive';

describe('архив бота', () => {
  it('сгенерированный бот отправляет оригинал из архива подставному Telegram', async () => {
    const data = { sheets: [{ id: 's', name: 'Тест', nodes: [{ id: 'm1', type: 'media', position: { x: 0, y: 0 }, data: { attachedMedia: ['/uploads/12/p.jpg'], buttons: [], keyboardType: 'none' } }] }], version: 2, activeSheetId: 's' };
    const code = generatePythonCode(data as any, { botName: 'Тест', projectId: 12, userDatabaseEnabled: false });
    const files = unzipSync(await exportProjectArchive(12, data, code));
    const dir = await mkdtemp(join(tmpdir(), 'bot-generated-export-'));
    try {
      for (const [name, bytes] of Object.entries(files)) {
        const path = join(dir, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, bytes);
      }
      const python = process.platform === 'win32' ? 'python' : 'python3';
      const env = { ...process.env, BOT_TOKEN: '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', PROJECT_ID: '12', TOKEN_ID: '1', MEDIA_RUNTIME_BASE_URL: '', MEDIA_RUNTIME_TOKEN: '', MEDIA_RUNTIME_REQUIRED: '', PYTHONIOENCODING: 'utf-8' };
      execFileSync(python, ['-m', 'py_compile', join(dir, 'bot.py')], { env });
      execFileSync(python, [join(__dirname, 'exportArchiveBotProbe.py'), join(dir, 'bot.py')], { env, cwd: dir });
    } finally { await rm(dir, { recursive: true, force: true }); }
  }, 30000);
  it('сохраняет оригинал и манифест, распакованный код работает без панели', async () => {
    const code = "from pathlib import Path\nassert (Path(__file__).parent / 'uploads/12/p.jpg').read_bytes() == b'abc'\n";
    const zip = await exportProjectArchive(12, { nodes: [{ image: '/uploads/12/p.jpg' }] }, code);
    const files = unzipSync(zip);
    const manifest = JSON.parse(strFromU8(files['manifest.json']));
    expect(manifest.media).toEqual([{ url: '/uploads/12/p.jpg', path: 'uploads/12/p.jpg', size: 3, version: 'v1' }]);
    const dir = await mkdtemp(join(tmpdir(), 'bot-export-'));
    try {
      for (const [name, bytes] of Object.entries(files)) {
        const path = join(dir, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, bytes);
      }
      execFileSync(process.platform === 'win32' ? 'python' : 'python3', [join(dir, 'bot.py')], { env: { PATH: process.env.PATH } });
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it('не создаёт архив при неполной загрузке или чужом файле', async () => {
    await expect(exportProjectArchive(12, { image: '/uploads/12/broken.jpg' }, '')).rejects.toThrow('неполный');
    await expect(exportProjectArchive(12, { image: '/uploads/13/p.jpg' }, '')).rejects.toThrow('Нет доступа');
  });
  it('переносит зарегистрированные старые ссылки и сохраняет внешние URL', async () => {
    const proxy = '/api/storage/proxy/s3/legacy.jpg';
    const absolute = 'https://bucket.test/photo.jpg';
    const prepared = await prepareArchiveMedia(12, { proxy, absolute, external: 'https://external.test/a.jpg' });
    const data = prepared.data as { proxy: string; absolute: string; external: string };
    expect(data.proxy).toMatch(/^\/uploads\/12\/export-.*\.jpg$/);
    expect(data.external).toBe('https://external.test/a.jpg');
    const code = `from pathlib import Path\nroot = Path(__file__).parent\nassert (root / ${JSON.stringify(data.proxy.slice(1))}).read_bytes() == b'abc'\nassert (root / ${JSON.stringify(data.absolute.slice(1))}).read_bytes() == b'abc'\n`;
    const files = unzipSync(await exportProjectArchive(12, data, code, prepared.sources));
    const manifest = JSON.parse(strFromU8(files['manifest.json']));
    expect(manifest.media).toHaveLength(2);
    const dir = await mkdtemp(join(tmpdir(), 'bot-legacy-export-'));
    try {
      for (const [name, bytes] of Object.entries(files)) {
        const path = join(dir, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, bytes);
      }
      execFileSync(process.platform === 'win32' ? 'python' : 'python3', [join(dir, 'bot.py')], { env: { PATH: process.env.PATH } });
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
