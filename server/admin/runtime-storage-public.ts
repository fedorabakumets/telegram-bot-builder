/**
 * @fileoverview Какие хранилища нельзя выбирать для бэкапов и сборок
 * @module server/admin/runtime-storage-public
 */

/** Строка списка хранилищ для формы админки */
export interface RuntimeStorageOption {
  /** ID в storage_configs */
  id: string;
  /** Подпись в списке */
  name: string;
  /** local или s3 */
  backend: string;
  /** Публичный адрес или каталог uploads */
  public: boolean;
}

/**
 * Публичное хранилище: local-default, publicUrlBase или папка uploads
 * @param row - ID и jsonb config
 * @returns true, если объекты доступны без входа в панель
 */
export function isPublicStorageRow(row: { id: string; config: unknown }): boolean {
  if (row.id === "local-default") return true;
  const config = row.config && typeof row.config === "object" ? (row.config as Record<string, unknown>) : {};
  const base = typeof config.publicUrlBase === "string" ? config.publicUrlBase.trim() : "";
  if (base) return true;
  const root = typeof config.rootPath === "string" ? config.rootPath.replace(/\\/g, "/").replace(/\/+$/, "") : "";
  return root === "uploads" || root.endsWith("/uploads");
}
