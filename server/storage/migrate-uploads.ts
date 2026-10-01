/**
 * @fileoverview Перенос папки `uploads/` в S3-хранилище загрузок: каждый файл
 * заливается под ключом, равным пути внутри `uploads/`, уже перенесённые файлы
 * (тот же размер в бакете) пропускаются, записи `media_files` переключаются на S3.
 * Логика без привязки к БД и SDK — зависимости передаются снаружи.
 * @module server/storage/migrate-uploads
 */

import { readdir, readFile, stat, unlink } from "fs/promises";
import path from "path";

import { contentTypeForKey } from "./uploads-storage";

/** Файл из папки загрузок */
export interface UploadFile {
  /** Ключ объекта (путь внутри uploads/ в POSIX-виде) */
  key: string;
  /** Абсолютный путь на диске */
  absPath: string;
  /** Размер в байтах */
  size: number;
}

/** Минимальный интерфейс целевого S3-хранилища */
export interface MigrationTarget {
  /** ID хранилища (storage_configs.id) */
  configId: string;
  /** Размер объекта в бакете либо null, если объекта нет */
  head(key: string): Promise<number | null>;
  /** Запись объекта в бакет */
  put(key: string, data: Buffer, mime: string): Promise<unknown>;
}

/** Параметры переноса */
export interface MigrateUploadsOptions {
  /** Папка загрузок на диске */
  rootDir: string;
  /** Целевое S3-хранилище */
  target: MigrationTarget;
  /** Только показать план, ничего не менять */
  dryRun: boolean;
  /** Удалять локальный файл после проверки копии в бакете */
  deleteLocal: boolean;
  /** Переключает записи media_files с этим ключом на S3; возвращает число обновлённых строк */
  updateRows: (key: string, configId: string) => Promise<number>;
  /** Сообщение о ходе переноса */
  onProgress?: (message: string) => void;
}

/** Итог переноса */
export interface MigrateUploadsResult {
  /** Всего файлов в папке */
  total: number;
  /** Залито в бакет (в dry-run — сколько будет залито) */
  uploaded: number;
  /** Уже были в бакете с тем же размером */
  skipped: number;
  /** Ошибки заливки или проверки */
  failed: number;
  /** Обновлено строк media_files */
  rowsUpdated: number;
  /** Удалено локальных файлов */
  deleted: number;
  /** Объём залитых данных в байтах */
  bytes: number;
}

/**
 * Рекурсивно собирает файлы загрузок. Файлы в корне папки (README и т.п.)
 * и скрытые файлы пропускаются: загрузки всегда лежат в `<projectId>/...`.
 * @param rootDir - Папка загрузок
 * @returns Список файлов с ключами, отсортированный по ключу
 */
export async function listUploadFiles(rootDir: string): Promise<UploadFile[]> {
  const result: UploadFile[] = [];

  /**
   * Обходит одну папку.
   * @param dir - Абсолютный путь папки
   * @param rel - Путь папки относительно rootDir
   */
  async function walk(dir: string, rel: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs, [...rel, entry.name]);
      } else if (entry.isFile() && rel.length > 0) {
        const info = await stat(abs);
        result.push({ key: [...rel, entry.name].join("/"), absPath: abs, size: info.size });
      }
    }
  }

  await walk(rootDir, []);
  return result.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Переносит файлы загрузок в S3. Повторный запуск безопасен.
 * @param options - Параметры переноса
 * @returns Итоговая статистика
 */
export async function migrateUploads(options: MigrateUploadsOptions): Promise<MigrateUploadsResult> {
  const { target, dryRun, deleteLocal, updateRows } = options;
  const log = options.onProgress ?? (() => {});
  const files = await listUploadFiles(options.rootDir);
  const res: MigrateUploadsResult = { total: files.length, uploaded: 0, skipped: 0, failed: 0, rowsUpdated: 0, deleted: 0, bytes: 0 };

  for (const file of files) {
    try {
      const remote = await target.head(file.key);
      if (remote === file.size) {
        res.skipped++;
      } else {
        res.uploaded++;
        res.bytes += file.size;
        if (dryRun) {
          log(`будет залит: ${file.key} (${file.size} Б)`);
          continue;
        }
        await target.put(file.key, await readFile(file.absPath), contentTypeForKey(file.key));
        if ((await target.head(file.key)) !== file.size) {
          throw new Error("размер в бакете не совпал после заливки");
        }
        log(`залит: ${file.key}`);
      }
      if (dryRun) continue;
      res.rowsUpdated += await updateRows(file.key, target.configId);
      if (deleteLocal) {
        await unlink(file.absPath);
        res.deleted++;
      }
    } catch (err) {
      res.failed++;
      log(`ошибка: ${file.key}: ${(err as Error)?.message ?? err}`);
    }
  }
  return res;
}
