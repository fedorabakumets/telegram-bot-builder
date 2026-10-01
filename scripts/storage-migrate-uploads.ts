/**
 * @fileoverview CLI: перенос папки uploads/ в S3-хранилище загрузок
 *
 * Использование:
 *   npm run storage:migrate-uploads -- [--target <storageId>] [--dir uploads] [--dry-run] [--delete-local]
 * Без --target берётся UPLOADS_STORAGE_ID. Ключ объекта = путь внутри uploads/,
 * адреса /uploads/... в проектах и media_files не меняются. Повторный запуск
 * пропускает уже перенесённые файлы. --delete-local удаляет файл с диска
 * только после проверки копии в бакете.
 * @module scripts/storage-migrate-uploads
 */

import "dotenv/config";

/**
 * Достаёт значение аргумента командной строки.
 * @param name - Имя флага (например, --target)
 * @returns Значение или undefined
 */
function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/**
 * Точка входа: находит хранилище, переносит файлы и печатает итог.
 */
async function main(): Promise<void> {
  const path = await import("path");
  const { and, eq } = await import("drizzle-orm");
  const { mediaFiles } = await import("@shared/schema");
  const { db } = await import("../server/database/db");
  const { ensureStorageRegistryLoaded } = await import("../server/storage/storage-registry");
  const { S3Backend } = await import("../server/storage/s3-backend");
  const { getUploadsStorageId, UPLOADS_URL_PREFIX } = await import("../server/storage/uploads-storage");
  const { migrateUploads } = await import("../server/storage/migrate-uploads");

  const dryRun = process.argv.includes("--dry-run");
  const deleteLocal = process.argv.includes("--delete-local");
  const targetId = argValue("--target") ?? getUploadsStorageId();
  const rootDir = path.resolve(argValue("--dir") ?? "uploads");
  if (!targetId) throw new Error("Укажите --target или UPLOADS_STORAGE_ID");

  const registry = await ensureStorageRegistryLoaded();
  const target = registry.list().find((b) => b.configId === targetId);
  if (!(target instanceof S3Backend)) {
    throw new Error(`S3-хранилище "${targetId}" не найдено в storage_configs (или не расшифровались ключи)`);
  }

  console.log(`📦 ${dryRun ? "[dry-run] " : ""}uploads → ${target.name} (${targetId}) из ${rootDir}`);

  /**
   * Переключает записи media_files с этим адресом на S3.
   * @param key - Ключ объекта
   * @param configId - ID хранилища
   * @returns Число обновлённых строк
   */
  const updateRows = async (key: string, configId: string): Promise<number> => {
    const rows = await db
      .update(mediaFiles)
      .set({ storageBackend: "s3", storageConfigId: configId, filePath: key })
      .where(and(eq(mediaFiles.url, `${UPLOADS_URL_PREFIX}${key}`), eq(mediaFiles.storageBackend, "local")))
      .returning({ id: mediaFiles.id });
    return rows.length;
  };

  const result = await migrateUploads({
    rootDir,
    target,
    dryRun,
    deleteLocal,
    updateRows,
    onProgress: (m) => console.log(`   ${m}`),
  });

  console.log(
    `✅ Файлов: ${result.total}, залито: ${result.uploaded} (${(result.bytes / 1024 / 1024).toFixed(1)} МБ), ` +
      `уже были: ${result.skipped}, ошибок: ${result.failed}, строк media_files: ${result.rowsUpdated}, удалено с диска: ${result.deleted}`,
  );
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
