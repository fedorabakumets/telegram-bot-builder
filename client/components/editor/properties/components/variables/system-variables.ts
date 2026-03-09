/**
 * @fileoverview Системные переменные для Telegram Bot Builder
 * Содержит константы и типы для системных переменных.
 * @module system-variables
 */

import { getAllSystemVariables } from '@shared/system-variables-config';

/** Интерфейс описания системной переменной */
export interface SystemVariable {
  /** Имя переменной для использования в шаблонах */
  name: string;
  /** ID источника переменной (всегда 'system') */
  nodeId: 'system';
  /** Тип источника (всегда 'system') */
  nodeType: 'system';
  /** Описание переменной на русском языке */
  description: string;
  /** Таблица-источник (опционально) */
  sourceTable?: string;
}

/**
 * Список системных переменных Telegram Bot Builder.
 * Всегда доступны для использования в текстах, клавиатурах, условиях.
 * Генерируются автоматически из схем таблиц БД.
 * @constant {SystemVariable[]}
 */
export const SYSTEM_VARIABLES: SystemVariable[] = [
  // Базовые переменные из Telegram API
  { name: 'user_name', nodeId: 'system', nodeType: 'system', description: 'Отображаемое имя пользователя (first_name или username)', sourceTable: 'bot_users' },
  { name: 'chat_id', nodeId: 'system', nodeType: 'system', description: 'ID чата', sourceTable: null as any },
  { name: 'bot_name', nodeId: 'system', nodeType: 'system', description: 'Имя бота', sourceTable: null as any },
  // Переменные из схем таблиц
  ...getAllSystemVariables()
];

/**
 * Получает иконку для типа переменной
 * @param {string} nodeType - Тип узла источника переменной
 * @returns {string} Название иконки FontAwesome без префикса 'fa-'
 */
export function getVariableIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    'user-input': 'keyboard', 'system': 'cog', 'start': 'terminal',
    'command': 'terminal', 'conditional': 'code-branch'
  };
  return icons[nodeType] || 'cube';
}

/**
 * Получает цветовой градиент для типа переменной
 * @param {string} nodeType - Тип узла источника переменной
 * @returns {string} Классы Tailwind для градиента
 */
export function getVariableColor(nodeType: string): string {
  const gradients: Record<string, string> = {
    'user-input': 'from-blue-400 to-blue-500', 'system': 'from-teal-400 to-teal-500',
    'start': 'from-orange-400 to-orange-500', 'command': 'from-orange-400 to-orange-500',
    'conditional': 'from-purple-400 to-purple-500'
  };
  return gradients[nodeType] || 'from-gray-400 to-gray-500';
}

/**
 * Получает текстовый бейдж для типа переменной
 * @param {string} nodeType - Тип узла источника переменной
 * @returns {string} Локализованное название типа
 */
export function getVariableBadge(nodeType: string): string {
  const badges: Record<string, string> = {
    'user-input': 'Ввод', 'system': 'Система', 'start': 'Команда',
    'command': 'Команда', 'conditional': 'Условие'
  };
  return badges[nodeType] || 'Другое';
}
