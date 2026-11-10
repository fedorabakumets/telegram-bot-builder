/** @fileoverview Проверки ограниченной по памяти записи файлов в локальное хранилище и S3. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { LocalDiskBackend } from '../local-disk-backend';
import { S3_FILE_PART_BYTES, uploadS3File } from '../upload-s3-file';

/** Временные каталоги, созданные текущим тестом. */
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });

/** Создаёт изолированный каталог. @returns Путь временного каталога. */
async function temporary(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'tbb-file-upload-'));
  directories.push(dir);
  return dir;
}

describe('потоковая запись файла', () => {
  it('сохраняет локально точные байты и сохраняет совместимость put', async () => {
    const dir = await temporary();
    const backend = new LocalDiskBackend({ configId: 'local', name: 'Тест', readOnly: false, rootPath: path.join(dir, 'objects') });
    const data = Buffer.alloc(1024 * 1024 + 7, 42);
    await writeFile(path.join(dir, 'source'), data);
    expect((await backend.putFile('nested/dump.sql', path.join(dir, 'source'), 'application/sql')).size).toBe(data.length);
    expect((await readFile(path.join(dir, 'objects/nested/dump.sql'))).equals(data)).toBe(true);
    await backend.put('legacy.txt', Buffer.from('старый API'), 'text/plain');
    expect(await readFile(path.join(dir, 'objects/legacy.txt'), 'utf8')).toBe('старый API');
  });

  it('при ошибке чтения сохраняет прежний объект и удаляет временные файлы', async () => {
    const dir = await temporary();
    const backend = new LocalDiskBackend({ configId: 'local', name: 'Тест', readOnly: false, rootPath: dir });
    await backend.put('dump.sql', Buffer.from('прежний'), 'text/plain');
    await expect(backend.putFile('dump.sql', path.join(dir, 'missing'), 'text/plain')).rejects.toThrow();
    expect(await readFile(path.join(dir, 'dump.sql'), 'utf8')).toBe('прежний');
    expect(await readdir(dir)).toEqual(['dump.sql']);
    await expect(backend.putFile('../escape', path.join(dir, 'dump.sql'), 'text/plain')).rejects.toThrow();
  });

  it('запрещает потоковую запись в локальное хранилище только для чтения', async () => {
    const backend = new LocalDiskBackend({ configId: 'local', name: 'Тест', readOnly: true, rootPath: await temporary() });
    await expect(backend.putFile('dump', 'missing', 'text/plain')).rejects.toThrow('только для чтения');
  });

  it('отправляет S3 последовательно частями не более 8 МиБ с точным содержимым', async () => {
    const dir = await temporary();
    const data = Buffer.alloc(S3_FILE_PART_BYTES * 2 + 123, 23);
    const source = path.join(dir, 'dump');
    await writeFile(source, data);
    const uploaded: Buffer[] = [];
    const calls: string[] = [];
    let active = 0;
    /** Имитирует завершение запроса до повторного использования буфера. */
    const send = vi.fn(async (command: { constructor: { name: string }; input: Record<string, unknown> }) => {
      calls.push(command.constructor.name);
      if (command.constructor.name === 'CreateMultipartUploadCommand') return { UploadId: 'test' };
      if (command.constructor.name === 'UploadPartCommand') {
        expect(++active).toBe(1);
        const body = command.input.Body as Buffer;
        expect(body.length).toBeLessThanOrEqual(S3_FILE_PART_BYTES);
        expect(command.input.ContentLength).toBe(body.length);
        await new Promise(resolve => setTimeout(resolve, 2));
        uploaded.push(Buffer.from(body));
        --active;
        return { ETag: `part-${uploaded.length}` };
      }
      return {};
    });
    expect(await uploadS3File({ send } as unknown as S3Client, 'bucket', 'dump', source, 'application/sql')).toBe(data.length);
    expect(Buffer.concat(uploaded).equals(data)).toBe(true);
    expect(calls).toEqual(['CreateMultipartUploadCommand', ...Array(3).fill('UploadPartCommand'), 'CompleteMultipartUploadCommand']);
  });

  it('отменяет незавершённую S3 загрузку и сохраняет исходную ошибку', async () => {
    const source = path.join(await temporary(), 'dump');
    await writeFile(source, 'данные');
    const calls: string[] = [];
    /** Имитирует отказ части и отказ очистки на стороне S3. */
    const send = vi.fn(async (command: { constructor: { name: string } }) => {
      calls.push(command.constructor.name);
      if (command.constructor.name === 'CreateMultipartUploadCommand') return { UploadId: 'test' };
      throw new Error(command.constructor.name === 'UploadPartCommand' ? 'отказ записи' : 'отказ очистки');
    });
    await expect(uploadS3File({ send } as unknown as S3Client, 'bucket', 'dump', source, 'text/plain')).rejects.toThrow('отказ записи');
    expect(calls).toEqual(['CreateMultipartUploadCommand', 'UploadPartCommand', 'AbortMultipartUploadCommand']);
  });

  it('сохраняет пустой файл без незавершённой multipart загрузки', async () => {
    const source = path.join(await temporary(), 'empty');
    await writeFile(source, '');
    /** Запоминает команду сохранения пустого объекта. */
    const send = vi.fn(async (_command: unknown) => ({}));
    expect(await uploadS3File({ send } as unknown as S3Client, 'bucket', 'empty', source, 'text/plain')).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(PutObjectCommand);
  });
});
