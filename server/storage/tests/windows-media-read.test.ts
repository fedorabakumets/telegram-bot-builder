/** @fileoverview Проверка безопасного чтения открытого дескриптора Windows. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { openWindowsMedia } from '../windows-media-read';

describe.skipIf(process.platform !== 'win32')('чтение Windows', () => {
  let parent: string, root: string, outside: string;
  beforeAll(async () => {
    parent = await mkdtemp(path.join(os.tmpdir(), 'media-test-'));
    root = path.join(parent, 'root'); outside = path.join(parent, 'outside');
    await mkdir(root); await mkdir(outside);
    await writeFile(path.join(root, 'file.txt'), 'content');
    await writeFile(path.join(outside, 'secret.txt'), 'secret');
    await symlink(outside, path.join(root, 'link'), 'junction');
  });
  afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
  it('возвращает содержимое проверенного файла и отвергает смену версии', async () => {
    const file = path.join(root, 'file.txt');
    const head = await openWindowsMedia(root, file, 'head');
    for await (const _part of head.stream) { /* ожидание завершения */ }
    const read = await openWindowsMedia(root, file, 'read', head.version);
    let body = ''; for await (const part of read.stream) body += part.toString();
    expect(body).toBe('content');
    await writeFile(file, 'changed version');
    await expect(openWindowsMedia(root, file, 'read', head.version)).rejects.toThrow();
  }, 30000);
  it('не открывает файл через junction наружу', async () => {
    await expect(openWindowsMedia(root, path.join(root, 'link', 'secret.txt'), 'read')).rejects.toThrow();
  }, 30000);
  it('корректно завершает отмену и отсутствие PowerShell', async () => {
    const controller = new AbortController();
    const pending = openWindowsMedia(root, path.join(root, 'file.txt'), 'head', '', controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow();
    const saved = process.env.SystemRoot;
    try {
      process.env.SystemRoot = path.join(parent, 'missing-windows');
      await expect(openWindowsMedia(root, path.join(root, 'file.txt'), 'head')).rejects.toThrow();
    } finally { process.env.SystemRoot = saved; }
  }, 30000);
});
