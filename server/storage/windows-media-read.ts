/** @fileoverview Безопасное потоковое чтение Windows через проверенный дескриптор. */
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import path from 'node:path';

/** Метаданные и поток открытого объекта. */
interface WindowsMedia {
  /** Размер в байтах */
  size: number;
  /** Версия открытого файла */
  version: string;
  /** Поток байтов */
  stream: Readable;
}

/** Открывает Windows файл в дочернем процессе и проверяет путь его handle.
 * @param root - Канонический корень хранилища
 * @param target - Путь файла
 * @param mode - Только метаданные либо поток
 * @param expected - Ожидаемая версия объекта
 * @returns Метаданные и поток открытого файла
 */
export async function openWindowsMedia(root: string, target: string, mode: 'head' | 'read', expected = '', signal?: AbortSignal): Promise<WindowsMedia> {
  if (signal?.aborted) throw new Error('Чтение файла отменено');
  const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const script = path.join(import.meta.dirname, 'windows-media-read.ps1');
  const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script,
    '-RootPath', root, '-TargetPath', target, ...(expected ? ['-ExpectedVersion', expected] : []), '-Mode', mode], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  child.on('error', error => child.stdout.destroy(error));
  /** Прерывает дочерний процесс при отмене запроса. */
  const abort = () => child.kill();
  signal?.addEventListener('abort', abort, { once: true });
  child.once('close', () => signal?.removeEventListener('abort', abort));
  const timer = setTimeout(() => child.kill(), 15000);
  const iterator = child.stdout[Symbol.asyncIterator]();
  let pending = Buffer.alloc(0);
  try {
    while (!pending.includes(10)) {
      const next = await iterator.next();
      if (next.done) throw new Error('Безопасное открытие файла Windows не выполнено');
      pending = Buffer.concat([pending, Buffer.from(next.value)]);
      if (pending.length > 65536) throw new Error('Недопустимый ответ проверки файла');
    }
    const end = pending.indexOf(10);
    const metadata = JSON.parse(pending.subarray(0, end).toString('utf8')) as { size: number; version: string };
    if (!Number.isSafeInteger(metadata.size) || metadata.size < 0 || !/^[a-f0-9:]+$/.test(metadata.version)) throw new Error('Недопустимые метаданные файла');
    const remainder = pending.subarray(end + 1);
    /** Передаёт данные и прекращает дочерний процесс при отмене чтения. */
    async function* chunks(): AsyncGenerator<Buffer> {
      try {
        if (remainder.length) yield remainder;
        for (;;) { const next = await iterator.next(); if (next.done) break; yield Buffer.from(next.value); }
        const exit = child.exitCode ?? await new Promise<number | null>(resolve => child.once('exit', resolve));
        if (exit !== 0) throw new Error('Ошибка чтения файла Windows');
      } finally { if (child.exitCode === null) child.kill(); }
    }
    clearTimeout(timer);
    const stream = Readable.from(chunks());
    stream.once('close', () => { if (child.exitCode === null) child.kill(); });
    return { ...metadata, stream };
  } catch (error) { clearTimeout(timer); child.kill(); throw error; }
}
