/**
 * @fileoverview Главный экспорт генератора ботов
 * Агрегирует и переэкспортирует все модули генератора
 */

// Главная функция генерации
export { generatePythonCode } from '../bot-generator';

// Ядро: конфигурация и логирование
export { isLoggingEnabled, logFlowAnalysis } from './core';
export { setGlobalLoggingEnabled, getGlobalLoggingEnabled } from './core';

// Импорт: генерация Python импортов
export { generatePythonImports, type ImportGeneratorOptions } from './imports';

// Генерация импортов по типам (для переиспользования)
export { generateCommandImports } from './imports';
export { generateUrlImageImports, generateDatetimeImports } from './imports';
export { generateParseModeImports } from './imports';
export { generateTelegramBadRequestImports } from './imports';

// Типы
export type { Button, ResponseOption } from './types';
export type { CodeNodeRange, CodeWithMap } from './types';
export type { BotNode } from './types';

// Функции каркаса
export {
  generateDockerfile,
  generateReadme,
  generateRequirementsTxt,
  generateEnvFile
} from './types';
