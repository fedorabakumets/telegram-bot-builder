/**
 * @fileoverview Экспорт утилит для работы с кодом
 */


// Code deduplication utilities
export { isFunctionDefined, isImportDefined, countFunctionDefinitions } from './code-deduplication';

// CSV safe code generation
export { generateSafeCsvWrite, generateSafeCsvRead } from './generate-csv-safe-code';

// Message text generation
export { generateMessageText, type GenerateMessageTextOptions } from './generate-message-text';

// Other utilities
export * from './generateGeneratedComment';

