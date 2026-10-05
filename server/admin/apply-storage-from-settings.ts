/**
 * @fileoverview Upsert строки s3-default из сохранённых настроек хранилищ
 * @module server/admin/apply-storage-from-settings
 */

import { eq, ne } from "drizzle-orm";
import { storageConfigs } from "@shared/schema";
import { db } from "../database/db";
import { runtimeEnv } from "../services/runtime-overlay";
import { S3_DEFAULT_ID, LOCAL_DEFAULT_ID } from "../storage/storage-config";
import { encryptCredentials, isEncryptionConfigured } from "../storage/storage-secrets";
import { getStorageRegistry } from "../storage/storage-registry";

/**
 * Собирает несекретные параметры S3 из оверлея или живого env
 * @param bucket - Имя бакета
 * @returns jsonb config без ключей доступа
 */
function readS3Config(bucket: string): Record<string, unknown> {
  const endpointUrl = runtimeEnv("S3_ENDPOINT_URL");
  const publicUrlBase = runtimeEnv("S3_PUBLIC_URL_BASE");
  return {
    ...(endpointUrl ? { endpointUrl } : {}),
    region: runtimeEnv("S3_REGION") || "us-east-1",
    bucket,
    forcePathStyle: runtimeEnv("S3_FORCE_PATH_STYLE")?.toLowerCase() === "true",
    ...(publicUrlBase ? { publicUrlBase } : {}),
  };
}

/**
 * Шифрует новые ключи. Пустая пара оставляет прежний secretsEnc.
 * Без STORAGE_ENCRYPTION_KEY ключи открытым текстом не пишутся.
 * @param input - Тело сохранения раздела
 * @param previous - Прежний secretsEnc
 * @returns Новое значение и предупреждение
 */
function resolveSecrets(input: Record<string, unknown>, previous: string | null): { secretsEnc: string | null; warning: string | null } {
  const access = typeof input.S3_ACCESS_KEY_ID === "string" ? input.S3_ACCESS_KEY_ID.trim() : "";
  const secret = typeof input.S3_SECRET_ACCESS_KEY === "string" ? input.S3_SECRET_ACCESS_KEY.trim() : "";
  if (!access && !secret) return { secretsEnc: previous, warning: null };
  if (!access || !secret) return { secretsEnc: previous, warning: "Нужны оба ключа S3 — старые креды не менялись" };
  if (!isEncryptionConfigured()) {
    return { secretsEnc: previous, warning: "STORAGE_ENCRYPTION_KEY не задан — ключи не записаны открытым текстом" };
  }
  return { secretsEnc: encryptCredentials({ accessKeyId: access, secretAccessKey: secret }), warning: null };
}

/**
 * Создаёт или обновляет s3-default и переключает активное хранилище.
 * @param input - Сырые поля формы; пустые секреты не затирают secretsEnc
 * @returns Предупреждение или null
 */
export async function applyStorageFromSettings(input: Record<string, unknown>): Promise<string | null> {
  const bucket = runtimeEnv("S3_BUCKET");
  if (!bucket) return "Бакет не задан — строка s3-default не обновлялась";
  const [existing] = await db.select().from(storageConfigs).where(eq(storageConfigs.id, S3_DEFAULT_ID)).limit(1);
  const { secretsEnc, warning } = resolveSecrets(input, existing?.secretsEnc ?? null);
  const wantS3 = runtimeEnv("STORAGE_BACKEND")?.toLowerCase() === "s3";
  const config = readS3Config(bucket);
  await db.transaction(async (tx) => {
    if (wantS3) {
      await tx.update(storageConfigs).set({ isActive: false }).where(ne(storageConfigs.id, S3_DEFAULT_ID));
    }
    const row = {
      name: `S3: ${bucket}`,
      backend: "s3" as const,
      isActive: wantS3,
      config,
      secretsEnc,
      readOnly: false,
    };
    if (existing) {
      await tx.update(storageConfigs).set(row).where(eq(storageConfigs.id, S3_DEFAULT_ID));
    } else {
      await tx.insert(storageConfigs).values({ id: S3_DEFAULT_ID, ...row });
    }
    if (!wantS3) {
      await tx.update(storageConfigs).set({ isActive: false }).where(ne(storageConfigs.id, LOCAL_DEFAULT_ID));
      await tx.update(storageConfigs).set({ isActive: true }).where(eq(storageConfigs.id, LOCAL_DEFAULT_ID));
    }
  });
  await getStorageRegistry().reload();
  return warning;
}
