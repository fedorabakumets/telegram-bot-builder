/**
 * @fileoverview Реестр хранилищ (`StorageRegistryImpl`): загружает ВСЕ записи
 * из `storage_configs`, строит по инстансу `StorageBackend` на каждую (несколько
 * локальных папок + несколько S3 одновременно) и резолвит нужный бэкенд по
 * `configId` при чтении/записи.
 *
 * Ключевые свойства (Req 10.3–10.8):
 *  - `reload()` сидирует дефолты при пустом реестре, затем перестраивает все
 *    бэкенды из БД без перезапуска сервера (Req 10.7);
 *  - каждый бэкенд хранится в независимой записи `Map` по `configId`, поэтому
 *    добавление/удаление одного хранилища не влияет на резолв остальных (Req 10.8);
 *  - `getActiveBackend()` возвращает помеченное `isActive=true` хранилище, с
 *    откатом к локальному дефолту (`local-default`);
 *  - `resolveBackend(null)` → локальный дефолт (обратная совместимость, Req 10.5),
 *    неизвестный `configId` также безопасно откатывается к локальному дефолту;
 *  - сбой расшифровки кредов S3 не роняет весь реестр: проблемный бэкенд
 *    пропускается, остальные продолжают работать.
 *
 * Открытые значения секретов нигде не логируются.
 * @module server/storage/storage-registry
 */

import { db } from "../database/db";

import {
  storageConfigs,
  type StorageConfig,
} from "@shared/schema";

import { LocalDiskBackend } from "./local-disk-backend";
import { S3Backend, type S3BackendParams } from "./s3-backend";
import type { StorageBackend, StorageRegistry } from "./storage-backend";
import {
  DEFAULT_LOCAL_ROOT_PATH,
  LOCAL_DEFAULT_ID,
  seedDefaultStorageConfigs,
} from "./storage-config";
import { decryptCredentials } from "./storage-secrets";

/**
 * Тип drizzle-инстанса, ожидаемый функциями сидирования. Локальный псевдоним,
 * чтобы не тянуть generic-параметры схемы в сигнатуры реестра.
 */
type SeedDb = Parameters<typeof seedDefaultStorageConfigs>[0];

/**
 * Реализация реестра хранилищ поверх таблицы `storage_configs`.
 *
 * Инстансы бэкендов кэшируются в `Map` по `configId`; пересборка выполняется
 * только в `reload()`. Между перезагрузками операции чтения (`getActiveBackend`,
 * `resolveBackend`, `list`, `listWritable`) работают синхронно по кэшу.
 */
export class StorageRegistryImpl implements StorageRegistry {
  /** Кэш построенных бэкендов по `configId` (независимые записи, Req 10.8) */
  private backends = new Map<string, StorageBackend>();

  /** `configId` активного для записи хранилища (`isActive=true`) либо null */
  private activeConfigId: string | null = null;

  /**
   * Запасной локальный бэкенд дефолта на случай, если `local-default` отсутствует
   * в БД (например, был удалён). Гарантирует, что резолв null/неизвестного
   * `configId` и `getActiveBackend()` никогда не падают (Req 10.5).
   */
  private fallbackLocal: StorageBackend = new LocalDiskBackend({
    configId: LOCAL_DEFAULT_ID,
    name: "Локально: uploads",
    readOnly: false,
    rootPath: DEFAULT_LOCAL_ROOT_PATH,
  });

  /** Признак того, что реестр уже был загружен хотя бы раз */
  private loaded = false;

  /**
   * Перезагружает реестр из `storage_configs`: при пустом реестре сидирует
   * ENV-дефолты, затем строит бэкенды по всем строкам. Перестроение полностью
   * заменяет кэш и не требует перезапуска сервера (Req 10.3, 10.7).
   */
  async reload(): Promise<void> {
    // Сидируем дефолты, если реестр пуст (идемпотентно).
    await seedDefaultStorageConfigs(db as unknown as SeedDb);

    const rows: StorageConfig[] = await db.select().from(storageConfigs);

    const next = new Map<string, StorageBackend>();
    let activeId: string | null = null;

    for (const row of rows) {
      const backend = this.buildBackend(row);
      // Пропускаем строки, для которых бэкенд построить не удалось (например,
      // S3 без валидных кредов): остальные хранилища продолжают работать.
      if (!backend) continue;
      next.set(row.id, backend);
      if (row.isActive) {
        activeId = row.id;
      }
    }

    this.backends = next;
    this.activeConfigId = activeId;
    this.loaded = true;
  }

  /**
   * Строит инстанс `StorageBackend` по одной записи конфигурации.
   *
   * Для `s3` расшифровывает `secretsEnc` в креды; при отсутствии секретов или
   * ошибке расшифровки логирует предупреждение (без значений) и возвращает null,
   * чтобы не уронить весь реестр.
   * @param row - Запись `storage_configs`
   * @returns Построенный бэкенд либо null, если построить нельзя
   */
  private buildBackend(row: StorageConfig): StorageBackend | null {
    try {
      if (row.backend === "local") {
        return this.buildLocalBackend(row);
      }
      if (row.backend === "s3") {
        return this.buildS3Backend(row);
      }
      console.warn(
        `[StorageRegistry] Неизвестный тип бэкенда "${row.backend}" для конфига "${row.id}" — пропуск`,
      );
      return null;
    } catch (err) {
      console.warn(
        `[StorageRegistry] Не удалось построить бэкенд для конфига "${row.id}": ${(err as Error)?.message ?? "неизвестная ошибка"}`,
      );
      return null;
    }
  }

  /**
   * Строит локальный дисковый бэкенд из `config.rootPath`.
   * @param row - Запись `storage_configs` типа `local`
   * @returns Инстанс `LocalDiskBackend`
   */
  private buildLocalBackend(row: StorageConfig): StorageBackend {
    const config = (row.config ?? {}) as { rootPath?: unknown };
    const rootPath =
      typeof config.rootPath === "string" && config.rootPath.trim().length > 0
        ? config.rootPath
        : DEFAULT_LOCAL_ROOT_PATH;
    return new LocalDiskBackend({
      configId: row.id,
      name: row.name,
      readOnly: row.readOnly,
      rootPath,
    });
  }

  /**
   * Строит S3-бэкенд: собирает несекретные параметры из `config` и
   * расшифровывает креды из `secretsEnc`.
   * @param row - Запись `storage_configs` типа `s3`
   * @returns Инстанс `S3Backend` либо null, если креды отсутствуют/невалидны
   */
  private buildS3Backend(row: StorageConfig): StorageBackend | null {
    if (!row.secretsEnc) {
      console.warn(
        `[StorageRegistry] S3-конфиг "${row.id}" без секретов (secretsEnc) — пропуск`,
      );
      return null;
    }

    let credentials;
    try {
      credentials = decryptCredentials(row.secretsEnc);
    } catch {
      // Не логируем содержимое секрета; только факт неудачи расшифровки.
      console.warn(
        `[StorageRegistry] Не удалось расшифровать креды S3-конфига "${row.id}" — пропуск`,
      );
      return null;
    }

    const raw = (row.config ?? {}) as Record<string, unknown>;
    const s3: S3BackendParams = {
      ...(typeof raw.endpointUrl === "string" && raw.endpointUrl
        ? { endpointUrl: raw.endpointUrl }
        : {}),
      region: typeof raw.region === "string" && raw.region ? raw.region : "us-east-1",
      bucket: typeof raw.bucket === "string" ? raw.bucket : "",
      forcePathStyle: raw.forcePathStyle === true,
      ...(typeof raw.publicUrlBase === "string" && raw.publicUrlBase
        ? { publicUrlBase: raw.publicUrlBase }
        : {}),
    };

    return new S3Backend({
      configId: row.id,
      name: row.name,
      readOnly: row.readOnly,
      s3,
      credentials,
    });
  }

  /**
   * Возвращает дефолтный локальный бэкенд (`local-default`) из кэша либо
   * запасной инстанс, если запись отсутствует в БД.
   * @returns Локальный дефолтный бэкенд
   */
  private getLocalDefault(): StorageBackend {
    return this.backends.get(LOCAL_DEFAULT_ID) ?? this.fallbackLocal;
  }

  /**
   * Возвращает активное хранилище для новых загрузок (`isActive=true`); при
   * отсутствии активной/доступной записи откатывается к локальному дефолту.
   * @returns Бэкенд, выбранный целевым для новых загрузок
   */
  getActiveBackend(): StorageBackend {
    if (this.activeConfigId) {
      const active = this.backends.get(this.activeConfigId);
      if (active) return active;
    }
    return this.getLocalDefault();
  }

  /**
   * Резолвит бэкенд по `configId` записи `media_files`. `null` → локальный
   * дефолт (обратная совместимость, Req 10.5); неизвестный `configId` также
   * безопасно откатывается к локальному дефолту.
   * @param configId - ID конфигурации хранилища либо null
   * @returns Соответствующий бэкенд либо локальный дефолт
   */
  resolveBackend(configId: string | null): StorageBackend {
    if (configId === null) {
      return this.getLocalDefault();
    }
    return this.backends.get(configId) ?? this.getLocalDefault();
  }

  /**
   * Возвращает все построенные бэкенды (для селектора/фильтра/менеджера).
   * @returns Список всех зарегистрированных бэкендов
   */
  list(): StorageBackend[] {
    return Array.from(this.backends.values());
  }

  /**
   * Возвращает только доступные для записи бэкенды (не `readOnly`).
   * @returns Список бэкендов, доступных для записи
   */
  listWritable(): StorageBackend[] {
    return this.list().filter((backend) => !backend.readOnly);
  }

  /**
   * Признак того, что реестр уже загружен хотя бы раз.
   * @returns true, если `reload()` успешно выполнялся
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}

/** Ленивый модульный синглтон реестра хранилищ */
let registrySingleton: StorageRegistryImpl | null = null;

/**
 * Возвращает синглтон реестра хранилищ, создавая его при первом обращении.
 * Не выполняет загрузку из БД — для гарантированной загрузки используйте
 * {@link ensureStorageRegistryLoaded}.
 * @returns Синглтон `StorageRegistryImpl`
 */
export function getStorageRegistry(): StorageRegistryImpl {
  if (!registrySingleton) {
    registrySingleton = new StorageRegistryImpl();
  }
  return registrySingleton;
}

/**
 * Гарантирует, что синглтон реестра загружен из `storage_configs` (выполняет
 * `reload()` ровно один раз при первой инициализации).
 * @returns Загруженный синглтон `StorageRegistryImpl`
 */
export async function ensureStorageRegistryLoaded(): Promise<StorageRegistryImpl> {
  const registry = getStorageRegistry();
  if (!registry.isLoaded()) {
    await registry.reload();
  }
  return registry;
}
