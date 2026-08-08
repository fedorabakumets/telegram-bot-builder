/**
 * @fileoverview Примеры тел/ответов для OpenAPI storage-configs.
 * @module server/swagger/paths/storage-config-examples
 */

/** Пример списка GET /api/storage-configs */
export const STORAGE_CONFIG_LIST_EXAMPLE = [
  {
    id: "local-default",
    name: "Локально: uploads",
    backend: "local" as const,
    isActive: true,
    config: { rootPath: "uploads" },
    readOnly: false,
    hasSecrets: false,
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "s3-main",
    name: "Основное S3",
    backend: "s3" as const,
    isActive: false,
    config: { bucket: "media", region: "ru-central1" },
    readOnly: false,
    hasSecrets: true,
    createdAt: "2026-02-01T12:00:00.000Z",
  },
];

/** Пример тела POST — local */
export const CREATE_LOCAL_EXAMPLE = {
  name: "Загрузки проекта",
  backend: "local" as const,
  config: { rootPath: "./uploads/extra" },
};

/** Пример тела POST — S3 */
export const CREATE_S3_EXAMPLE = {
  id: "s3-main",
  name: "Основное S3",
  backend: "s3" as const,
  config: {
    bucket: "media",
    region: "ru-central1",
    endpointUrl: "https://storage.example.com",
    forcePathStyle: true,
  },
  s3AccessKeyId: "AKIAEXAMPLE",
  s3SecretAccessKey: "secretExample",
};
