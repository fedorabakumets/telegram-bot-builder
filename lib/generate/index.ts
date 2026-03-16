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
export * from './generateGroupsConfiguration';
export * from './generateNodeNavigation';

// Ре-экспорт из typed-renderer для миграции на Jinja2
export { generateConfig, generateHeader, generateUtils, generateSafeEditOrSend } from '../templates/typed-renderer';

