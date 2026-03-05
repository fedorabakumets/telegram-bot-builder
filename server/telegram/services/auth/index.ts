/**
 * @fileoverview Баррер-файл для экспорта всех сервисов авторизации
 * @module server/telegram/services/auth/index
 */

// Публичные API сервисы
export { verifyPassword } from './2fa-service.js';
export { generateQR, generateQRToken } from './qr-generator.js';
export { checkQRStatus } from './qr-status-checker.js';

// Генерация QR
export { generateBasicQR } from './qr-basic-generator.js';
export { generateQRTokenWithExpiry } from './qr-token-generator.js';
export { checkMigrationNeeded, handleQRMigration } from './qr-migration-handler.js';

// Проверка QR
export { getOrCreateQRClient } from './qr-client-manager.js';
export { importQRToken } from './qr-token-importer.js';
export { formatTokenPreview, formatTokenCheckMessage, formatScanSuccessMessage } from './qr-token-formatter.js';
export { validateTokenImportResult } from './qr-token-validator.js';

// 2FA обработка
export { handleQRPasswordError } from './qr-2fa-processor.js';
export { is2FAError, requestQR2FAPassword } from './qr-2fa-request.js';
export { verifyQR2FAPassword } from './qr-2fa-verifier.js';
export { extractQRSessionAfter2FA } from './qr-session-extractor.js';

// Константы сообщений
export * from './qr-error-messages.js';
