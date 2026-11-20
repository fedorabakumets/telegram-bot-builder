/** @fileoverview Уровни журналирования и подписи для настроек проекта и бота. */

/** Варианты детализации журнала по возрастанию подробности. */
export const LOG_LEVELS = [
  { value: 'ERROR', label: 'Только ошибки', color: 'red' },
  { value: 'WARNING', label: 'Предупреждения', color: 'yellow' },
  { value: 'INFO', label: 'Информация', color: 'blue' },
  { value: 'DEBUG', label: 'Отладка (подробно)', color: 'gray' },
] as const;

/** Допустимый уровень журналирования. */
export type LogLevel = (typeof LOG_LEVELS)[number]['value'];
