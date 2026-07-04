/**
 * @fileoverview Чтение конфигурации хранилищ из переменных окружения и
 * первичное сидирование реестра `storage_configs`. Здесь сосредоточены:
 *
 * 1. Разбор лимита квоты `STORAGE_LIMIT_GB` (гигабайты → байты). Пустое,
 *    отсутствующее, нечисловое значение либо значение ≤ 0 трактуется как
 *    безлимитное (`null`). Допускается дробное число гигабайт (например 1.5).
 * 2. Построение дефолтных черновиков конфигов из ENV: всегда локальное
 *    хранилище `local-default` (папка `uploads/`) и, при заданных `S3_*`
 *    (минимум `S3_BUCKET`) и/или `STORAGE_BACKEND=s3`, S3-хранилище
 *    `s3-default`. Ровно один конфиг помечается активным.
 * 3. Идемпотентное сидирование: `seedDefaultStorageConfigs(db)` вставляет
 *    ENV-дефолты только при пустом реестре (см. design.md «Бутстрап»). При
 *    непустом реестре ничего не делает — дальнейшие хранилища живут в БД и
 *    управляются через API/UI.
 *
 * Секреты S3 (`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`) шифруются через
 * `encryptCredentials` и кладутся в `secretsEnc`; в открытом виде в БД не
 * попадают (Req 11.4, 11.5).
 * @module server/storage/storage-config
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  storageConfigs,
  type InsertStorageConfig,
} from "@shared/schema";

import type { S3BackendParams } from "./s3-backend";
import {
  encryptCredentials,
  isEncryptionConfigured,
} from "./storage-secrets";

/** Имя ENV-переменной с лимитом хранилища в гигабайтах */
export const STORAGE_LIMIT_GB_ENV = "STORAGE_LIMIT_GB";

/** Имя ENV-переменной с типом дефолтного бэкенда для сидирования */
export const STORAGE_BACKEND_ENV = "STORAGE_BACKEND";

/** Количество байт в одном гигабайте (1 ГБ = 1024^3 байт) */
export const BYTES_PER_GB = 1024 ** 3;

/** Стабильный идентификатор дефолтного локального хранилища */
export const LOCAL_DEFAULT_ID = "local-default";

/** Стабильный идентификатор дефолтного S3-хранилища */
export const S3_DEFAULT_ID = "s3-default";

/** Путь по умолчанию для дефолтного локального хранилища (относительно корня) */
export const DEFAULT_LOCAL_ROOT_PATH = "uploads";

/**
 * Считывает значение строковой ENV-переменной с обрезкой пробелов.
 * @param name - Имя переменной окружения
 * @returns Обрезанное значение либо пустая строка, если не задано
 */
function readTrimmedEnv(name: string): string {
  const raw = process.env[name];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Считывает лимит хранилища из `STORAGE_LIMIT_GB` и переводит гигабайты в байты.
 *
 * Правила (Req 4.2, 4.3): пустое/отсутствующее/нечисловое значение, а также
 * любое значение ≤ 0 трактуются как безлимитное и возвращают `null`. Дробные
 * гигабайты поддерживаются (например, `1.5` → 1610612736 байт). Результат
 * округляется вниз до целого числа байт.
 * @returns Лимит в байтах (целое число) либо `null` для безлимитного режима
 */
export function readStorageLimitBytes(): number | null {
  const raw = readTrimmedEnv(STORAGE_LIMIT_GB_ENV);
  if (raw.length === 0) {
    return null;
  }
  const gigabytes = Number(raw);
  if (!Number.isFinite(gigabytes) || gigabytes <= 0) {
    return null;
  }
  return Math.floor(gigabytes * BYTES_PER_GB);
}

/**
 * Парсит булеву ENV-переменную: истинно только при строке "true" (без учёта
 * регистра и пробелов).
 * @param name - Имя переменной окружения
 * @returns true, если значение равно "true"; иначе false
 */
function readBooleanEnv(name: string): boolean {
  return readTrimmedEnv(name).toLowerCase() === "true";
}

/**
 * Определяет, нужно ли создавать дефолтный S3-конфиг при сидировании.
 *
 * S3-дефолт создаётся, если задан бакет (`S3_BUCKET` — минимально необходимый
 * параметр) и/или явно выбран бэкенд `STORAGE_BACKEND=s3`. Без имени бакета
 * валидный S3-конфиг построить нельзя, поэтому `S3_BUCKET` обязателен.
 * @returns true, если по ENV следует засидить S3-хранилище
 */
function shouldSeedS3(): boolean {
  return readTrimmedEnv("S3_BUCKET").length > 0;
}

/**
 * Собирает несекретные параметры S3 (`config.s3`) из ENV-переменных `S3_*`.
 * @returns Объект параметров S3-бэкенда
 */
function readS3ParamsFromEnv(): S3BackendParams {
  const endpointUrl = readTrimmedEnv("S3_ENDPOINT_URL");
  const region = readTrimmedEnv("S3_REGION") || "us-east-1";
  const bucket = readTrimmedEnv("S3_BUCKET");
  const publicUrlBase = readTrimmedEnv("S3_PUBLIC_URL_BASE");
  return {
    ...(endpointUrl ? { endpointUrl } : {}),
    region,
    bucket,
    forcePathStyle: readBooleanEnv("S3_FORCE_PATH_STYLE"),
    ...(publicUrlBase ? { publicUrlBase } : {}),
  };
}

/**
 * Шифрует креды S3 из ENV (`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`) для поля
 * `secretsEnc`. Если креды не заданы или шифрование не настроено
 * (`STORAGE_ENCRYPTION_KEY` отсутствует), возвращает `null` — конфиг при этом
 * создаётся без секретов (их можно добавить позже через UI).
 * @returns Зашифрованная строка `secretsEnc` либо `null`
 */
function buildS3SecretsEnc(): string | null {
  const accessKeyId = readTrimmedEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = readTrimmedEnv("S3_SECRET_ACCESS_KEY");
  if (!accessKeyId || !secretAccessKey || !isEncryptionConfigured()) {
    return null;
  }
  return encryptCredentials({ accessKeyId, secretAccessKey });
}

/**
 * Строит набор дефолтных черновиков конфигов хранилищ из ENV для сидирования.
 *
 * Всегда присутствует `local-default` (папка `uploads/`). При заданном
 * `S3_BUCKET` (и/или `STORAGE_BACKEND=s3`) добавляется `s3-default` с
 * параметрами из `S3_*` и зашифрованными кредами. Активным помечается ровно
 * один конфиг: S3 — если `STORAGE_BACKEND=s3` и S3-конфиг создан; иначе —
 * локальный (Req 12.5).
 * @returns Массив черновиков `InsertStorageConfig` в порядке вставки
 */
export function buildDefaultStorageConfigDrafts(): InsertStorageConfig[] {
  const seedS3 = shouldSeedS3();
  const wantS3Active = readTrimmedEnv(STORAGE_BACKEND_ENV).toLowerCase() === "s3";
  // S3 активно только если оно вообще создаётся и явно выбрано бэкендом по ENV.
  const s3Active = seedS3 && wantS3Active;

  const drafts: InsertStorageConfig[] = [
    {
      id: LOCAL_DEFAULT_ID,
      name: "Локально: uploads",
      backend: "local",
      // Ровно один активный: локальный активен, когда S3 не активно.
      isActive: !s3Active,
      config: { rootPath: DEFAULT_LOCAL_ROOT_PATH },
      secretsEnc: null,
      readOnly: false,
    },
  ];

  if (seedS3) {
    const s3Params = readS3ParamsFromEnv();
    drafts.push({
      id: S3_DEFAULT_ID,
      name: `S3: ${s3Params.bucket}`,
      backend: "s3",
      isActive: s3Active,
      config: { ...s3Params } as Record<string, unknown>,
      secretsEnc: buildS3SecretsEnc(),
      readOnly: false,
    });
  }

  return drafts;
}

/**
 * Проверяет, пуст ли реестр `storage_configs`.
 * @param db - Экземпляр drizzle (node-postgres)
 * @returns true, если в таблице нет ни одной записи
 */
async function isRegistryEmpty(
  db: NodePgDatabase<Record<string, unknown>>,
): Promise<boolean> {
  const rows = await db.select({ id: storageConfigs.id }).from(storageConfigs).limit(1);
  return rows.length === 0;
}

/**
 * Идемпотентно сидирует дефолтные конфиги хранилищ из ENV при пустом реестре.
 *
 * Если в `storage_configs` уже есть хотя бы одна запись — ничего не делает
 * (дальнейшее управление хранилищами идёт через API/UI). Иначе вставляет
 * ENV-дефолты (`local-default` и, при необходимости, `s3-default`) одной
 * операцией (Req 12.5).
 * @param db - Экземпляр drizzle (node-postgres), полученный из `server/database/db`
 * @returns Массив вставленных черновиков (пустой, если сидирование пропущено)
 */
export async function seedDefaultStorageConfigs(
  db: NodePgDatabase<Record<string, unknown>>,
): Promise<InsertStorageConfig[]> {
  const empty = await isRegistryEmpty(db);
  if (!empty) {
    return [];
  }
  const drafts = buildDefaultStorageConfigDrafts();
  await db.insert(storageConfigs).values(drafts);
  return drafts;
}
