/**
 * @fileoverview Кеш сборок ботов на машине исполнителя: скачивание по временной ссылке
 * из S3, проверка размера и sha256, распаковка в <кеш>/<отпечаток>/<файл>.py.
 * Одинаковая сборка повторно не скачивается.
 * @module server/runner/runnerBuildCache
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, rm, stat, utimes } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { openBuildDownload } from "./runnerBuildDownload";
import { buildByteLimit, limitBuildStream, matchesCachedBuild, writeBuildStream } from "./runnerBuildStream";

/** Сборка из команды start_bot */
export interface RunnerBuild {
  /** Временная ссылка на сжатый код */
  url: string;
  /** sha256 несжатого кода */
  sha256: string;
  /** Размер несжатого кода */
  size: number;
  /** Отпечаток генерации — имя каталога в кеше */
  fingerprint: string;
  /** Имя основного .py */
  file_name: string;
}

/** Скачивание сжатой сборки (подменяется в тестах) */
export type FetchBuild = (url: string) => Promise<Buffer>;

/**
 * Скачивает ограниченную сборку для совместимости с буферными потребителями
 * @param url - Временная ссылка
 * @returns сжатое содержимое
 */
export async function fetchBuildOverHttp(url: string): Promise<Buffer> {
  const response = await openBuildDownload(url, AbortSignal.timeout(60_000));
  const chunks: Buffer[] = [];
  const stream = response.pipe(limitBuildStream(buildByteLimit("RUNNER_BUILD_MAX_COMPRESSED_BYTES")));
  response.on("error", (error) => stream.destroy(error));
  try {
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } finally {
    response.destroy();
  }
}

/**
 * Проверяет поле build команды
 * @param raw - Значение поля
 * @returns сборка
 * @throws Error, если поля некорректны (отпечаток и имя файла попадают в путь)
 */
export function parseRunnerBuild(raw: unknown): RunnerBuild {
  const b = raw as Partial<RunnerBuild> | null;
  if (!b || typeof b.url !== "string" || typeof b.sha256 !== "string" || typeof b.size !== "number") {
    throw new Error("Некорректное поле build в start_bot");
  }
  if (typeof b.fingerprint !== "string" || !/^[a-f0-9]{16,128}$/.test(b.fingerprint)) {
    throw new Error("Некорректный отпечаток сборки");
  }
  if (typeof b.file_name !== "string" || !/^[^/\\\0]+\.py$/.test(b.file_name) || b.file_name.startsWith(".")) {
    throw new Error("Некорректное имя файла сборки");
  }
  return b as RunnerBuild;
}

/**
 * Возвращает путь к коду сборки в кеше, скачивая её при необходимости
 * @param build - Сборка из команды
 * @param cacheDir - Каталог кеша
 * @param fetchBuild - Скачивание
 * @returns абсолютный путь к .py
 */
export async function ensureCachedBuild(
  build: RunnerBuild,
  cacheDir: string,
  fetchBuild: FetchBuild = fetchBuildOverHttp,
): Promise<string> {
  const dir = join(cacheDir, build.fingerprint);
  const file = join(dir, build.file_name);
  if (!Number.isSafeInteger(build.size) || build.size < 0
    || build.size > buildByteLimit("RUNNER_BUILD_MAX_UNCOMPRESSED_BYTES")) {
    throw new Error("Сборка повреждена: превышен допустимый размер");
  }
  if (await matchesCachedBuild(file, build)) {
    const now = new Date();
    await utimes(dir, now, now);
    return file;
  }
  await mkdir(dir, { recursive: true });
  const source = fetchBuild === fetchBuildOverHttp
    ? await openBuildDownload(build.url, AbortSignal.timeout(60_000))
    : Readable.from([await fetchBuild(build.url)]);
  await writeBuildStream(source, file, build);
  return file;
}

/**
 * Удаляет старые сборки, оставляя `keep` последних по времени использования
 * @param cacheDir - Каталог кеша
 * @param keep - Сколько оставить
 * @param inUse - Каталоги сборок, которые сейчас запущены (не удаляются)
 */
export async function pruneBuildCache(cacheDir: string, keep: number, inUse: Set<string> = new Set()): Promise<void> {
  if (!existsSync(cacheDir)) return;
  const entries = await Promise.all(
    (await readdir(cacheDir)).map(async (name) => ({ name, mtime: (await stat(join(cacheDir, name))).mtimeMs })),
  );
  entries.sort((a, b) => b.mtime - a.mtime);
  for (const entry of entries.slice(keep)) {
    if (!inUse.has(entry.name)) await rm(join(cacheDir, entry.name), { recursive: true, force: true });
  }
}
