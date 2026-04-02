/**
 * @fileoverview Типы и константы для статистики бота
 * Содержит интерфейсы и конфигурацию отображения статистики
 */

/**
 * Данные статистики бота
 */
export interface BotStatsData {
  /** Общее количество узлов */
  totalNodes: number;
  /** Количество узлов-команд */
  commandNodes: number;
  /** Количество узлов-сообщений */
  messageNodes: number;
  /** Количество узлов с фото */
  photoNodes: number;
  /** Количество узлов клавиатур */
  keyboardNodes: number;
  /** Общее количество кнопок */
  totalButtons: number;
  /** Количество команд в меню */
  commandsInMenu: number;
  /** Количество команд только для администраторов */
  adminOnlyCommands: number;
}

/**
 * Конфигурация карточки статистики
 */
export interface StatConfig {
  /** Ключ поля из BotStatsData */
  key: keyof BotStatsData;
  /** Отображаемое название */
  label: string;
  /** CSS класс цвета */
  colorClass: string;
  /** CSS класс цвета для тёмной темы */
  darkColorClass: string;
  /** CSS класс иконки FontAwesome */
  icon: string;
}

/**
 * Конфигурация всех метрик статистики бота
 */
export const STATS_CONFIG: StatConfig[] = [
  { key: 'totalNodes', label: 'Всего узлов', colorClass: 'text-blue-600 dark:text-blue-400', darkColorClass: 'dark:bg-blue-900/20', icon: 'fas fa-cubes' },
  { key: 'commandNodes', label: 'Команд', colorClass: 'text-green-600 dark:text-green-400', darkColorClass: 'dark:bg-green-900/20', icon: 'fas fa-terminal' },
  { key: 'totalButtons', label: 'Кнопок', colorClass: 'text-purple-600 dark:text-purple-400', darkColorClass: 'dark:bg-purple-900/20', icon: 'fas fa-hand-pointer' },
  { key: 'messageNodes', label: 'Сообщений', colorClass: 'text-amber-600 dark:text-amber-400', darkColorClass: 'dark:bg-amber-900/20', icon: 'fas fa-comment' },
  { key: 'photoNodes', label: 'Фото', colorClass: 'text-pink-600 dark:text-pink-400', darkColorClass: 'dark:bg-pink-900/20', icon: 'fas fa-image' },
  { key: 'keyboardNodes', label: 'Клавиатур', colorClass: 'text-cyan-600 dark:text-cyan-400', darkColorClass: 'dark:bg-cyan-900/20', icon: 'fas fa-keyboard' },
  { key: 'commandsInMenu', label: 'В меню', colorClass: 'text-indigo-600 dark:text-indigo-400', darkColorClass: 'dark:bg-indigo-900/20', icon: 'fas fa-list' },
  { key: 'adminOnlyCommands', label: 'Админ', colorClass: 'text-red-600 dark:text-red-400', darkColorClass: 'dark:bg-red-900/20', icon: 'fas fa-user-shield' },
];
