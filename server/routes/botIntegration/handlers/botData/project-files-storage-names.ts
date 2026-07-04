/**
 * @fileoverview Человекочитаемые имена хранилищ для столбца «Хранилище».
 * Загружает карту storage_configs.id → { name, backend } и резолвит
 * понятную подпись для каждой записи media_files.
 * @module botIntegration/handlers/botData/project-files-storage-names
 */

import { db } from "../../../../database/db";
import { storageConfigs } from "@shared/schema";

/** Подпись по умолчанию для локального хранилища/записей без storageConfigId */
const LOCAL_LABEL = "Локально";

/** Инфо о хранилище для подписи */
interface StorageNameEntry {
  /** Человекочитаемое имя из storage_configs.name */
  name: string;
  /** Тип бэкенда ("local" | "s3") */
  backend: string;
}

/** Карта storage_configs.id → инфо о хранилище */
export type StorageNameMap = Record<string, StorageNameEntry>;

/**
 * Загружает карту всех конфигураций хранилищ (id → имя/бэкенд).
 * Таблица небольшая, поэтому читается целиком за один запрос.
 * @returns Карта storageConfigId → { name, backend }
 */
export async function loadStorageNameMap(): Promise<StorageNameMap> {
  const rows = await db
    .select({ id: storageConfigs.id, name: storageConfigs.name, backend: storageConfigs.backend })
    .from(storageConfigs);

  const map: StorageNameMap = {};
  for (const row of rows) {
    map[row.id] = { name: row.name, backend: row.backend };
  }
  return map;
}

/**
 * Возвращает понятную подпись хранилища для записи media_files.
 * Для null/local-default и локального бэкенда — «Локально».
 * @param storageConfigId - ID конфигурации хранилища (может быть null)
 * @param storageBackend - Тип бэкенда записи ("local" | "s3")
 * @param map - Карта имён хранилищ
 * @returns Человекочитаемое имя хранилища
 */
export function resolveStorageName(
  storageConfigId: string | null | undefined,
  storageBackend: string | null | undefined,
  map: StorageNameMap,
): string {
  if (storageConfigId && map[storageConfigId]) {
    return map[storageConfigId].name;
  }
  if (!storageConfigId || storageConfigId === "local-default" || storageBackend === "local") {
    return LOCAL_LABEL;
  }
  return storageConfigId;
}
