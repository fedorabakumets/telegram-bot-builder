/**
 * @fileoverview Примеры JSON для OpenAPI тега media.
 * @module server/swagger/paths/media-examples
 */

/** Пример media_files */
export const MEDIA_FILE_EXAMPLE = {
  id: 10,
  projectId: 42,
  fileName: "photo.jpg",
  fileType: "photo",
  fileSize: 12345,
  mimeType: "image/jpeg",
  url: "/uploads/42/2026-08-08/photo.jpg",
  description: null,
  tags: [],
  usageCount: 0,
  storageBackend: "local",
  createdAt: "2026-08-08T12:00:00.000Z",
};

export const MEDIA_LIST_EXAMPLE = [MEDIA_FILE_EXAMPLE];
