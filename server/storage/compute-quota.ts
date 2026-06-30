/**
 * @fileoverview Вычисление квоты файлового хранилища проекта. Это каноничный
 * источник расчёта квоты для API-эндпоинта `/storage-quota` и других мест.
 *
 * Квота считается суммой размеров файлов проекта, лежащих на локальных
 * бэкендах (`storage_backend = 'local'`); файлы в S3 в серверную квоту не
 * входят (Req 4.4). Лимит берётся из ENV `STORAGE_LIMIT_GB` через
 * `readStorageLimitBytes()` (пусто/0/невалидно → `null` = безлимит, Req 4.5).
 * Флаг превышения `quotaExceeded` поднимается только при заданном лимите,
 * когда использовано больше лимита; квота мягкая и загрузку не блокирует
 * (Req 4.1, 4.7).
 *
 * Сумма размеров переиспользует `computeLocalUsedBytes` из хелпера загрузки
 * (`server/routes/media/upload-storage-helper`), чтобы расчёт занятого места
 * был единым во всём приложении.
 * @module server/storage/compute-quota
 */

import { computeLocalUsedBytes } from "../routes/media/upload-storage-helper";
import { readStorageLimitBytes } from "./storage-config";

/** Результат расчёта квоты хранилища проекта */
export interface StorageQuota {
  /** Использовано байт (сумма локальных файлов проекта) */
  usedBytes: number;
  /** Лимит в байтах либо null для безлимитного режима */
  limitBytes: number | null;
  /** Превышена ли мягкая квота (false при безлимите) */
  quotaExceeded: boolean;
}

/**
 * Определяет, превышена ли квота при заданном использовании и лимите.
 *
 * При `limitBytes = null` (безлимит) всегда возвращает false. Иначе — true,
 * когда использовано строго больше лимита (Req 4.7).
 * @param usedBytes - Использовано байт
 * @param limitBytes - Лимит в байтах либо null для безлимитного режима
 * @returns true, если лимит задан и использование превышает его
 */
export function isQuotaExceeded(
  usedBytes: number,
  limitBytes: number | null,
): boolean {
  if (limitBytes === null) {
    return false;
  }
  return usedBytes > limitBytes;
}

/**
 * Вычисляет квоту локального хранилища проекта.
 *
 * Считает занятое место по локальным бэкендам проекта (Req 4.4), читает лимит
 * из ENV (Req 4.5) и поднимает флаг превышения по мягкой квоте (Req 4.1, 4.7).
 * @param projectId - Идентификатор проекта
 * @returns Объект `{ usedBytes, limitBytes, quotaExceeded }`
 */
export async function computeStorageQuota(
  projectId: number,
): Promise<StorageQuota> {
  const usedBytes = await computeLocalUsedBytes(projectId);
  const limitBytes = readStorageLimitBytes();
  return {
    usedBytes,
    limitBytes,
    quotaExceeded: isQuotaExceeded(usedBytes, limitBytes),
  };
}
