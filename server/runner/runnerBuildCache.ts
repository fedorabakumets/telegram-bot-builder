/**
 * @fileoverview Кеш сборок ботов на машине исполнителя: скачивание по временной ссылке
 * из S3, проверка размера и sha256, распаковка в <кеш>/<отпечаток>/<файл>.py.
 * Одинаковая сборка повторно не скачивается.
 * @module server/runner/runnerBuildCache
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256Hex, unpackBotBuild } from "../bots/builds/botBuildCodec";

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
 * Скачивает сборку через fetch
 * @param url - Временная ссылка
 * @returns сжатое содержимое
 */
export async function fetchBuildOverHttp(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} при скачивании сборки`);
  return Buffer.from(await response.arrayBuffer());
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
  if (existsSync(file) && sha256Hex(await readFile(file)) === build.sha256) {
    const now = new Date();
    await utimes(dir, now, now);
    return file;
  }
  const code = unpackBotBuild(await fetchBuild(build.url), build);
  await mkdir(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, code);
  await rename(tmp, file);
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
