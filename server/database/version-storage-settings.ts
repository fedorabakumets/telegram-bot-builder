/**
 * @fileoverview Постоянный выбор места хранения новых версий проекта.
 */
import { pool } from './db';

/** Режим и выделенная конфигурация снимков. */
export interface VersionStorageSettings {
  /** Способ записи новых снимков. */
  mode: 'postgres' | 's3';
  /** ID приватного S3-хранилища. */
  storageId: string | null;
}

/**
 * Читает выбор администратора, сохраняя совместимость с переменной окружения.
 * @returns Текущая настройка хранения
 */
export async function getVersionStorageSettings(): Promise<VersionStorageSettings> {
  const result = await pool.query<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings WHERE key IN ('project_versions.mode', 'project_versions.storage_id')");
  const values = new Map(result.rows.map(row => [row.key, row.value]));
  const storageId = values.get('project_versions.storage_id') || process.env.VERSION_SNAPSHOT_STORAGE_ID?.trim() || null;
  const mode = values.get('project_versions.mode') || (storageId ? 's3' : 'postgres');
  return { mode: mode === 's3' ? 's3' : 'postgres', storageId };
}

/**
 * Сохраняет выбор администратора одной транзакцией.
 * @param settings - Новый режим и конфигурация
 * @returns Завершение записи
 */
export async function saveVersionStorageSettings(settings: VersionStorageSettings): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries({
      'project_versions.mode': settings.mode,
      'project_versions.storage_id': settings.storageId || '',
    })) {
      await client.query(`INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`, [key, value]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
