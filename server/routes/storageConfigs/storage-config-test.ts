/**
 * @fileoverview Проверка доступности (connectivity) хранилища по записи
 * `storage_configs`. Для S3 выполняется `HeadBucketCommand` (с откатом на
 * `ListObjectsV2` c `MaxKeys=1`, если HEAD не поддерживается провайдером).
 * Для локального бэкенда проверяется, что корневая папка существует и доступна
 * на запись, либо может быть создана (Req 11.9).
 *
 * Секретные значения кредов нигде не логируются и не возвращаются в диагностике.
 * @module server/routes/storageConfigs/storage-config-test
 */

import { access, mkdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import type { StorageConfig } from "@shared/schema";
import { decryptCredentials } from "../../storage/storage-secrets";

/** Результат проверки доступности хранилища */
export interface StorageTestResult {
  /** Признак успешной проверки */
  ok: boolean;
  /** Человекочитаемая диагностика (без секретов) */
  message: string;
}

/**
 * Проверяет доступность хранилища в зависимости от его типа.
 * @param row - Запись конфигурации хранилища из БД
 * @returns Результат проверки `{ ok, message }`
 */
export async function testStorageConfig(
  row: StorageConfig,
): Promise<StorageTestResult> {
  if (row.backend === "local") {
    return testLocalConfig(row);
  }
  if (row.backend === "s3") {
    return testS3Config(row);
  }
  return { ok: false, message: `Неизвестный тип бэкенда: ${row.backend}` };
}

/**
 * Проверяет доступность локальной папки: существует и доступна на запись либо
 * может быть создана.
 * @param row - Запись конфигурации хранилища типа `local`
 * @returns Результат проверки доступности папки
 */
async function testLocalConfig(row: StorageConfig): Promise<StorageTestResult> {
  const config = (row.config ?? {}) as { rootPath?: unknown };
  const rawRoot =
    typeof config.rootPath === "string" && config.rootPath.trim().length > 0
      ? config.rootPath.trim()
      : "uploads";
  const absRoot = path.resolve(process.cwd(), rawRoot);
  try {
    await access(absRoot, fsConstants.W_OK);
    return { ok: true, message: `Папка доступна на запись: ${rawRoot}` };
  } catch {
    // Папки может не быть — пробуем создать её рекурсивно.
    try {
      await mkdir(absRoot, { recursive: true });
      return { ok: true, message: `Папка создана и доступна: ${rawRoot}` };
    } catch (err) {
      return {
        ok: false,
        message: `Папка недоступна и не может быть создана: ${rawRoot} (${(err as Error)?.message ?? "ошибка"})`,
      };
    }
  }
}

/**
 * Проверяет доступность S3-бакета через `HeadBucketCommand`; при ошибке HEAD
 * пробует `ListObjectsV2` (MaxKeys=1) для провайдеров без поддержки HEAD.
 * @param row - Запись конфигурации хранилища типа `s3`
 * @returns Результат проверки доступности бакета
 */
async function testS3Config(row: StorageConfig): Promise<StorageTestResult> {
  if (!row.secretsEnc) {
    return { ok: false, message: "Не заданы креды S3 (secretsEnc пуст)" };
  }

  let credentials;
  try {
    credentials = decryptCredentials(row.secretsEnc);
  } catch {
    return { ok: false, message: "Не удалось расшифровать креды S3" };
  }

  const raw = (row.config ?? {}) as Record<string, unknown>;
  const bucket = typeof raw.bucket === "string" ? raw.bucket : "";
  if (!bucket) {
    return { ok: false, message: "Не задано имя бакета (config.bucket)" };
  }

  const endpoint =
    typeof raw.endpointUrl === "string" && raw.endpointUrl.trim()
      ? raw.endpointUrl.trim()
      : undefined;
  const client = new S3Client({
    region: typeof raw.region === "string" && raw.region ? raw.region : "us-east-1",
    forcePathStyle: raw.forcePathStyle === true,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    ...(endpoint ? { endpoint } : {}),
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true, message: `Бакет доступен: ${bucket}` };
  } catch (headErr) {
    // Часть S3-провайдеров не поддерживает HEAD — пробуем лёгкий list.
    try {
      await client.send(
        new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }),
      );
      return { ok: true, message: `Бакет доступен (list): ${bucket}` };
    } catch (listErr) {
      const reason =
        (listErr as Error)?.message ?? (headErr as Error)?.message ?? "ошибка соединения";
      return { ok: false, message: `S3 недоступен: ${reason}` };
    }
  }
}
