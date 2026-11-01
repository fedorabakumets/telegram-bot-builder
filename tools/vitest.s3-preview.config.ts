/** @fileoverview Изолированный запуск проверки запрета записи в S3 без загрузки всего проекта. */
export default { test: { include: ['server/storage/tests/s3-read-only.test.ts', 'server/routes/botIntegration/handlers/botData/dev-media-token.test.ts'], environment: 'node' } };
