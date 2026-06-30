/**
 * @fileoverview Таблица медиафайлов
 * @module shared/schema/tables/media-files
 */

import { pgTable, text, serial, integer, bigint, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { storageConfigs } from "./storage-configs";
import { telegramUsers } from "./telegram-users";

/**
 * Таблица медиафайлов
 */
export const mediaFiles = pgTable("media_files", {
  /** Уникальный идентификатор файла */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Оригинальное имя файла */
  fileName: text("file_name").notNull(),
  /** Тип файла ("photo", "video", "audio", "document") */
  fileType: text("file_type").notNull(),
  /** Путь к файлу на сервере */
  filePath: text("file_path").notNull(),
  /** Размер файла в байтах */
  fileSize: integer("file_size").notNull(),
  /** MIME тип файла */
  mimeType: text("mime_type").notNull(),
  /** URL для доступа к файлу */
  url: text("url").notNull(),
  /** Описание файла */
  description: text("description"),
  /** Теги для поиска */
  tags: text("tags").array().default([]),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: integer("is_public").default(0),
  /** Количество использований файла */
  usageCount: integer("usage_count").default(0),
  /** Кэшированный Telegram file_id для быстрой повторной отправки */
  telegramFileId: text("telegram_file_id"),
  /** ID медиафайла-обложки (ссылка на фото из той же таблицы, только для видео) */
  thumbnailMediaId: integer("thumbnail_media_id").references((): AnyPgColumn => mediaFiles.id, { onDelete: "set null" }),
  /** URL обложки видео (альтернатива thumbnailMediaId — для внешних URL без скачивания) */
  thumbnailUrl: text("thumbnail_url"),
  /** ID пользователя Telegram, загрузившего файл (ссылка на telegram_users.id) */
  uploadedBy: bigint("uploaded_by", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "set null" }),
  /** Бэкенд хранилища файла ("local" | "s3") */
  storageBackend: text("storage_backend").default("local").notNull(),
  /** ID конфигурации хранилища (ссылка на storage_configs.id) */
  storageConfigId: text("storage_config_id").references(() => storageConfigs.id, { onDelete: "set null" }),
  /** Уникальный идентификатор файла Telegram (file_unique_id) для дедупликации */
  fileUniqueId: text("file_unique_id"),
  /** Дата создания файла */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления файла */
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  /** Уникальный индекс: один URL на проект (для ON CONFLICT при сохранении file_id) */
  urlProjectUnique: uniqueIndex("media_files_url_project_id_unique").on(table.url, table.projectId),
}));

/** Схема для вставки данных медиафайла */
export const insertMediaFileSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Имя файла (обязательное поле) */
  fileName: z.string().min(1, "Имя файла обязательно"),
  /** Тип файла ("photo", "video", "audio", "document") */
  fileType: z.enum(["photo", "video", "audio", "document"]),
  /** Путь к файлу (обязательное поле) */
  filePath: z.string().min(1, "Путь к файлу обязателен"),
  /** Размер файла (обязательное поле, должен быть больше 0) */
  fileSize: z.number().min(1, "Размер файла должен быть больше 0"),
  /** MIME тип файла (обязательное поле) */
  mimeType: z.string().min(1, "MIME тип обязателен"),
  /** URL файла (обязательное поле, должен быть корректным URL) */
  url: z.string().url("Некорректный URL"),
  /** Описание файла */
  description: z.string().nullable().optional(),
  /** Теги файла */
  tags: z.array(z.string()).default([]),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: z.number().min(0).max(1).default(0),
  /** Кэшированный Telegram file_id (заполняется автоматически после первой отправки) */
  telegramFileId: z.string().nullable().optional(),
  /** ID обложки видео (опционально, только для видео) */
  thumbnailMediaId: z.number().int().nullable().optional(),
  /** URL обложки видео (строка, без FK) */
  thumbnailUrl: z.string().nullable().optional(),
});

/** Тип записи медиафайла */
export type MediaFile = typeof mediaFiles.$inferSelect;

/** Тип для вставки медиафайла */
export type InsertMediaFile = typeof mediaFiles.$inferInsert;
