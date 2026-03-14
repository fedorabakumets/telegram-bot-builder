/**
 * @fileoverview Конфигурация генератора ботов
 * Глобальные переменные и настройки для генерации кода
 */

/** 
 * Глобальный флаг состояния логирования
 * Может быть переопределён параметром generatePythonCode
 */
export let globalLoggingEnabled = false;

/**
 * Устанавливает глобальное состояние логирования
 * @param enabled - Включить или выключить логирование
 */
export const setGlobalLoggingEnabled = (enabled: boolean): void => {
  globalLoggingEnabled = enabled;
};

/**
 * Получает текущее состояние глобального логирования
 * @returns {boolean} Статус логирования
 */
export const getGlobalLoggingEnabled = (): boolean => {
  return globalLoggingEnabled;
};
