/**
 * @fileoverview Ограниченная потоковая распаковка и проверка сборок до публикации в кеше.
 */
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import type { RunnerBuild } from "./runnerBuildCache";

/**
 * Возвращает положительный лимит размера из окружения.
 * @param name - Название настройки
 * @param fallback - Значение по умолчанию
 * @returns Ограничение в байтах
 */
export function buildByteLimit(name: string, fallback = 256 * 1024 * 1024): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

/**
 * Создаёт преобразователь с ограничением количества байтов и необязательным хешированием.
 * @param max - Максимум байтов
 * @param consume - Получатель проверенных порций данных
 * @returns Ограничивающий поток
 */
export function limitBuildStream(max: number, consume?: (chunk: Buffer) => void): Transform {
  let size = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size > max) return callback(new Error("Сборка повреждена: превышен допустимый размер"));
      consume?.(chunk);
      callback(null, chunk);
    },
  });
}

/**
 * Проверяет кеш потоковым чтением без буфера размером с исходник.
 * @param file - Проверяемый файл
 * @param build - Ожидаемые характеристики
 * @returns Совпали ли размер и контрольная сумма
 */
export async function matchesCachedBuild(file: string, build: RunnerBuild): Promise<boolean> {
  const hash = createHash("sha256");
  let size = 0;
  try {
    for await (const chunk of createReadStream(file)) {
      size += chunk.length;
      if (size > build.size) return false;
      hash.update(chunk);
    }
    return size === build.size && hash.digest("hex") === build.sha256;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/**
 * Распаковывает поток во временный файл и публикует только проверенный результат.
 * @param source - Сжатое содержимое
 * @param file - Итоговый путь
 * @param build - Ожидаемые характеристики
 * @returns Завершение атомарной публикации
 */
export async function writeBuildStream(source: Readable, file: string, build: RunnerBuild): Promise<void> {
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  const hash = createHash("sha256");
  let size = 0;
  try {
    await pipeline(source, limitBuildStream(buildByteLimit("RUNNER_BUILD_MAX_COMPRESSED_BYTES")),
      createGunzip(), limitBuildStream(build.size, (chunk) => { size += chunk.length; hash.update(chunk); }),
      createWriteStream(tmp, { flags: "wx" }));
    if (size !== build.size || hash.digest("hex") !== build.sha256) {
      throw new Error("Сборка повреждена: размер или sha256 не совпадают");
    }
    await rename(tmp, file);
  } finally {
    await rm(tmp, { force: true });
  }
}
