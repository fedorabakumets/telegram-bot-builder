/**
 * @fileoverview Примеры JSON для OpenAPI project-files.
 * @module server/swagger/paths/project-files-examples
 */

/** GET …/files */
export const PROJECT_FILES_LIST_EXAMPLE = {
  files: [
    {
      id: 88,
      source: "uploaded",
      mediaType: "photo",
      fileId: "AgACAgIAAxkBAA",
      fileName: "cover.jpg",
      fileSize: 245760,
      createdAt: "2026-08-11T12:00:00.000Z",
    },
  ],
  total: 120,
  page: 1,
  limit: 50,
};

/** DELETE body */
export const PROJECT_FILES_DELETE_BODY_EXAMPLE = {
  items: [
    { id: 88, source: "uploaded" },
    { id: 501, source: "incoming" },
  ],
};

/** DELETE 200 */
export const PROJECT_FILES_DELETE_OK_EXAMPLE = { success: true, deleted: 2 };

/** GET storage-quota */
export const STORAGE_QUOTA_EXAMPLE = {
  usedBytes: 52428800,
  limitBytes: 1073741824,
  quotaExceeded: false,
};

/** 403 */
export const PROJECT_FILES_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};
