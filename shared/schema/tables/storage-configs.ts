/**
 * @fileoverview Реестр конфигураций хранилищ (несколько S3 и локальных папок).
 * Секретные ключи S3 хранятся зашифрованными (app-secret), наружу не отдаются.
 * @module shared/schema/tables/storage-configs
 */

import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Таблица реестра хранилищ: несколько S3 (разные бакеты/endpoint'ы/креды)
 * и несколько локальных папок. Одно хранилище помечено активным для новых
 * загрузок; читать можно из всех.
 */
export const storageConfigs = pgTable("storage_configs", {
  /** Стабильный строковый идентификатор (используется в media_files.storageConfigId) */
  id: text("id").primaryKey(),
  /** Человекочитаемое имя («Локально: uploads», «S3: backups») */
  name: text("name").notNull(),
  /** Тип бэкенда: "local" | "s3" */
  backend: text("backend").notNull(),
  /** Активно для новых загрузок (ровно одно активное на инстанс) */
  isActive: boolean("is_active").default(false).notNull(),
  /**
   * Несекретные параметры (jsonb):
   * local → { rootPath }; s3 → { endpointUrl, region, bucket, forcePathStyle, publicUrlBase }
   */
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  /** Зашифрованные креды S3 (accessKeyId/secretAccessKey); null для local */
  secretsEnc: text("secrets_enc"),
  /** Доступно только для чтения (нельзя выбрать для записи) */
  readOnly: boolean("read_only").default(false).notNull(),
  /** Дата создания */
  createdAt: timestamp("created_at").defaultNow(),
});

/** Тип записи конфигурации хранилища */
export type StorageConfig = typeof storageConfigs.$inferSelect;

/** Тип для вставки конфигурации хранилища */
export type InsertStorageConfig = typeof storageConfigs.$inferInsert;
