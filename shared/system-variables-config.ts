/**
 * @fileoverview Конфигурация источников системных переменных
 * Описывает таблицы БД и поля для автоматической генерации переменных
 * @module system-variables-config
 */

/** Тип поля переменной */
type VariableFieldType = 'string' | 'number' | 'boolean' | 'datetime' | 'json' | 'array';

/** Поле переменной */
export interface VariableField {
  /** Имя колонки в БД */
  column: string;
  /** Имя переменной для использования в шаблонах */
  variableName: string;
  /** Описание переменной */
  description: string;
  /** Тип поля */
  fieldType: VariableFieldType;
  /** Функция трансформации (опционально) */
  transform?: string;
}

/** Источник системных переменных */
export interface SystemVariableSource {
  /** Название таблицы БД */
  table: string;
  /** Префикс для переменных (опционально) */
  prefix?: string;
  /** Поля таблицы */
  fields: VariableField[];
  /** Описание источника */
  description: string;
}

/**
 * Источники системных переменных из таблиц БД
 */
export const SYSTEM_VARIABLE_SOURCES: SystemVariableSource[] = [
  {
    table: 'bot_users',
    prefix: 'user',
    description: 'Пользовательские данные',
    fields: [
      { column: 'user_id', variableName: 'user_id', description: 'ID пользователя в Telegram', fieldType: 'number' },
      { column: 'username', variableName: 'username', description: 'Юзернейм пользователя', fieldType: 'string' },
      { column: 'first_name', variableName: 'first_name', description: 'Имя пользователя', fieldType: 'string' },
      { column: 'last_name', variableName: 'last_name', description: 'Фамилия пользователя', fieldType: 'string' },
      { column: 'registered_at', variableName: 'user_registered_at', description: 'Дата регистрации', fieldType: 'datetime' },
      { column: 'last_interaction', variableName: 'user_last_interaction', description: 'Последнее взаимодействие', fieldType: 'datetime' },
      { column: 'interaction_count', variableName: 'user_interaction_count', description: 'Количество взаимодействий', fieldType: 'number' },
      { column: 'is_active', variableName: 'user_is_active', description: 'Активен ли пользователь', fieldType: 'boolean' },
      { column: 'is_bot', variableName: 'user_is_bot', description: 'Является ли ботом', fieldType: 'boolean' }
    ]
  },
  {
    table: 'user_telegram_settings',
    prefix: 'tg',
    description: 'Настройки Telegram аккаунта',
    fields: [
      { column: 'api_id', variableName: 'tg_api_id', description: 'Telegram API ID', fieldType: 'string' },
      { column: 'api_hash', variableName: 'tg_api_hash', description: 'Telegram API Hash', fieldType: 'string' },
      { column: 'phone_number', variableName: 'tg_phone', description: 'Номер телефона', fieldType: 'string' },
      { column: 'session_string', variableName: 'tg_session', description: 'Session string', fieldType: 'string' },
      { column: 'is_active', variableName: 'tg_is_active', description: 'Активны ли настройки', fieldType: 'boolean' }
    ]
  },
  {
    table: 'user_ids',
    description: 'Список ID для рассылки',
    fields: [
      { column: 'user_id', variableName: 'user_ids', description: 'Список всех ID (используйте фильтры |join:", " или |join:"\\n")', fieldType: 'array' },
      { column: 'user_id', variableName: 'user_ids_count', description: 'Количество ID', fieldType: 'number', transform: 'count' }
    ]
  }
];

/**
 * Преобразует источник переменных в формат для редактора
 * @param source - Источник переменных
 * @returns Массив переменных для редактора
 */
export function sourceToVariables(source: SystemVariableSource): Array<{
  name: string;
  nodeId: 'system';
  nodeType: 'system';
  description: string;
  sourceTable: string;
}> {
  return source.fields.map(field => ({
    name: field.variableName,
    nodeId: 'system' as const,
    nodeType: 'system' as const,
    description: `${field.description} (${source.table}.${field.column})`,
    sourceTable: source.table
  }));
}

/**
 * Получает все системные переменные из всех источников
 * @returns Массив всех системных переменных
 */
export function getAllSystemVariables(): Array<{
  name: string;
  nodeId: 'system';
  nodeType: 'system';
  description: string;
  sourceTable: string;
}> {
  return SYSTEM_VARIABLE_SOURCES.flatMap(sourceToVariables);
}
