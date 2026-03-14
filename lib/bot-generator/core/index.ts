/**
 * @fileoverview Экспорт ядра генератора ботов
 * Агрегирует конфигурацию и логирование
 */

export { globalLoggingEnabled, setGlobalLoggingEnabled, getGlobalLoggingEnabled } from './config';
export { isLoggingEnabled, logFlowAnalysis } from './logging';
