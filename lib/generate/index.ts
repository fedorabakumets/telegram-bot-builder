/**
 * @fileoverview Generate Module — модуль для генерации различных частей кода Telegram ботов
 * Экспортирует функции для генерации БД, навигации, медиа, утилит и других компонентов
 */

// Generate Module
// Модуль для генерации различных частей кода Telegram ботов

export * from '../bot-generator/database/generateDatabaseCode';
export * from '../bot-generator/logging/generate-message-logging';
export * from '../bot-generator/MediaHandler/generateMediaFileFunctions';
export * from './generate-node-handlers';
export * from './generateApiConfig';
export * from './generateBasicBotSetupCode';
export * from './generateGroupsConfiguration';
export * from './generateNodeNavigation';
export * from './generateSafeEditOrSendCode';
export * from './generateUtf8EncodingCode';
export * from './generateUtilityFunctions';

