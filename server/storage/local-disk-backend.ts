/**
 * @fileoverview Локальный дисковый бэкенд хранилища (`LocalDiskBackend`):
 * реализация `StorageBackend` поверх файловой системы. Каждый инстанс привязан
 * к одной корневой папке (`rootPath`) конкретного конфига `storage_configs`,
 * поэтому несколько локальных папок = несколько независимых инстансов.
 *
 * URL-конвенция совпадает с исторической раздачей статики (`/uploads/...`):
 * объект с ключом `key` в папке `uploads` доступен по `/uploads/<key>`, что
 * сохраняет доступность ранее загруженных файлов.
 * @module server/storage/local-disk-backend
 */

import { createReadStream } from "fs";
import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";

import type { StorageBackend, StoredObject } from "./storage-backend";

/** Несекретные параметры локального бэкенда (поле config.local) */
export interface LocalDiskBackendOptions {
  /** ID конфигурации хранилища (storage_configs.id) */
  configId: string;
  /** Человекочитаемое имя (для UI) */
  name: string;
  /** Только для чтения (нельзя выбрать целевым для записи) */
  readOnly: boolean;
  /**
   * Корневая папка хранения относительно cwd или абсолютная.
   * По умолчанию (если пусто) — `uploads`.
   */
  rootPath: string;
}

/**
 * Локальный дисковый бэкенд: пишет/читает/удаляет файлы в пределах `rootPath`.
 * Один инстанс обслуживает одну сконфигурированную папку.
 */
export class LocalDiskBackend implements StorageBackend {
  /** Тип бэкенда (всегда "local") */
  public readonly backend = "local";
  /** ID конфигурации (storage_configs.id) */
  public readonly configId: string;
  /** Человекочитаемое имя (для UI) */
  public readonly name: string;
  /** Только для чтения */
  public readonly readOnly: boolean;

  /** Абсолютный путь к корневой папке хранения */
  private readonly absRoot: string;
  /** Префикс публичного URL (например, "/uploads"), без завершающего слеша */
  private readonly urlPrefix: string;

  /**
   * @param options - Параметры конфигурации локального хранилища
   */
  constructor(options: LocalDiskBackendOptions) {
    this.configId = options.configId;
    this.name = options.name;
    this.readOnly = options.readOnly;

    // Нормализуем корневую папку: пусто → "uploads".
    const rawRoot = (options.rootPath || "uploads").trim();
    this.absRoot = path.resolve(process.cwd(), rawRoot);

    // URL-префикс строим из относительного к cwd сегмента папки, чтобы
    // дефолтная папка "uploads" давала исторический префикс "/uploads".
    const rel = path.relative(process.cwd(), this.absRoot);
    const normalized = rel.split(path.sep).filter(Boolean).join("/");
    this.urlPrefix = "/" + (normalized || "uploads");
  }

  /**
   * Приводит ключ к безопасному относительному пути внутри `rootPath`.
   * Защищает от path traversal: запрещает выход за пределы корневой папки.
   * @param key - Относительный ключ объекта
   * @returns Безопасный относительный путь (с разделителями ОС)
   */
  private safeRelative(key: string): string {
    // Убираем ведущие слеши и нормализуем разделители в POSIX-стиль.
    const cleaned = String(key).replace(/^[/\\]+/, "");
    // Нормализуем и проверяем, что итоговый путь не покидает корень.
    const abs = path.resolve(this.absRoot, cleaned);
    const relToRoot = path.relative(this.absRoot, abs);
    if (relToRoot === "" || relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
      throw new Error(`Недопустимый ключ объекта (выход за пределы хранилища): ${key}`);
    }
    return relToRoot;
  }

  /**
   * Возвращает абсолютный путь файла для ключа (с проверкой безопасности).
   * @param key - Относительный ключ объекта
   * @returns Абсолютный путь к файлу на диске
   */
  private absPath(key: string): string {
    return path.join(this.absRoot, this.safeRelative(key));
  }

  /**
   * Сохраняет буфер по ключу, создавая родительские папки при необходимости.
   * @param key - Относительный ключ объекта в хранилище
   * @param data - Содержимое объекта в виде буфера
   * @param _mime - MIME-тип (на диске не используется, хранится в media_files)
   * @returns Метаданные сохранённого объекта
   */
  async put(key: string, data: Buffer, _mime: string): Promise<StoredObject> {
    const filePath = this.absPath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return {
      backend: this.backend,
      configId: this.configId,
      key,
      url: this.getUrl(key),
      size: data.length,
    };
  }

  /**
   * Открывает объект на чтение в виде потока.
   * @param key - Относительный ключ объекта в хранилище
   * @returns Читаемый поток с содержимым объекта
   */
  async get(key: string): Promise<NodeJS.ReadableStream> {
    const filePath = this.absPath(key);
    // Проверяем существование, чтобы вернуть осмысленную ошибку вместо
    // отложенного события "error" на потоке.
    await stat(filePath);
    return createReadStream(filePath);
  }

  /**
   * Удаляет объект; отсутствие файла (ENOENT) считается успехом (идемпотентность).
   * @param key - Относительный ключ объекта в хранилище
   */
  async delete(key: string): Promise<void> {
    try {
      await unlink(this.absPath(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return;
      throw err;
    }
  }

  /**
   * Строит публичный/проксируемый URL объекта по исторической конвенции
   * (`/uploads/<key>` для папки `uploads`).
   * @param key - Относительный ключ объекта в хранилище
   * @returns Публичный URL объекта
   */
  getUrl(key: string): string {
    const rel = this.safeRelative(key).split(path.sep).filter(Boolean).join("/");
    return `${this.urlPrefix}/${rel}`;
  }
}
