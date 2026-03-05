/**
 * @fileoverview Баррер-файл для экспорта всех сервисов авторизации
 * @module server/telegram/services/auth/index
 */

export { verifyPassword } from './2fa-service.js';
export { generateQR, generateQRToken } from './qr-generator.js';
export { checkQRStatus } from './qr-status-checker.js';

// Внутренние модули (для переиспользования)
export { generateBasicQR } from './qr-basic-generator.js';
export { generateQRTokenWithExpiry } from './qr-token-generator.js';
export { checkMigrationNeeded, handleQRMigration } from './qr-migration-handler.js';
export { getOrCreateQRClient } from './qr-client-manager.js';
export { importQRToken, formatQRStatusResult } from './qr-token-importer.js';
export { handleQRPasswordError } from './qr-2fa-processor.js';

// Константы сообщений
export * from './qr-error-messages.js';
