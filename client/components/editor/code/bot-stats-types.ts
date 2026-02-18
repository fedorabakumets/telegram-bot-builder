/**
 * @fileoverview Типы и константы для статистики бота
 * Содержит интерфейсы и конфигурацию отображения статистики
 */

/** Интерфейс статистики бота */
export interface BotStatsData {
  totalNodes: number;
  commandNodes: number;
  messageNodes: number;
  photoNodes: number;
  keyboardNodes: number;
  totalButtons: number;
  commandsInMenu: number;
  adminOnlyCommands: number;
}

/** Конфигурация карточки статистики */
export interface StatConfig {
  key: keyof BotStatsData;
  label: string;
  colorClass: string;
  darkColorClass: string;
  icon: string;
}

/** Конфигурация всех метрик статистики */
export const STATS_CONFIG: StatConfig[] = [
  { key: 'totalNodes', label: 'Всего узлов', colorClass: 'text-blue-600 dark:text-blue-400', darkColorClass: 'dark:bg-blue-900/20', icon: 'fas fa-cubes' },
  { key: 'commandNodes', label: 'Команд', colorClass: 'text-green-600 dark:text-green-400', darkColorClass: 'dark:bg-green-900/20', icon: 'fas fa-terminal' },
  { key: 'totalButtons', label: 'Кнопок', colorClass: 'text-purple-600 dark:text-purple-400', darkColorClass: 'dark:bg-purple-900/20', icon: 'fas fa-hand-pointer' },
  { key: 'messageNodes', label: 'Сообщений', colorClass: 'text-amber-600 dark:text-amber-400', darkColorClass: 'dark:bg-amber-900/20', icon: 'fas fa-comment' },
  { key: 'photoNodes', label: 'Фото', colorClass: 'text-pink-600 dark:text-pink-400', darkColorClass: 'dark:bg-pink-900/20', icon: 'fas fa-image' },
  { key: 'keyboardNodes', label: 'Клавиатур', colorClass: 'text-cyan-600 dark:text-cyan-400', darkColorClass: 'dark:bg-cyan-900/20', icon: 'fas fa-keyboard' },
  { key: 'commandsInMenu', label: 'В меню', colorClass: 'text-indigo-600 dark:text-indigo-400', darkColorClass: 'dark:bg-indigo-900/20', icon: 'fas fa-list' },
  { key: 'adminOnlyCommands', label: 'Админ', colorClass: 'text-red-600 dark:text-red-400', darkColorClass: 'dark:bg-red-900/20', icon: 'fas fa-user-shield' }
];
