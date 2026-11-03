/** @fileoverview Тип медиафайла в истории сообщения без дополнительных полей хранилища. */
import type { MediaFile } from "@shared/schema";

/** Поля медиафайла, которые возвращает выборка истории сообщений. */
export type MessageMedia = Pick<MediaFile,
  | "id" | "projectId" | "fileName" | "fileType" | "filePath" | "fileSize"
  | "mimeType" | "url" | "description" | "tags" | "isPublic" | "usageCount"
  | "createdAt" | "updatedAt"
> & {
  /** Роль медиа в сообщении. */
  mediaKind: string;
  /** Порядок медиа в сообщении. */
  orderIndex: number;
};
