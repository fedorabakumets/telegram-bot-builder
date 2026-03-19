/**
 * @fileoverview Константы для sidebar редактора ботов
 * Содержит группировки компонентов и другие константы
 * @module components/editor/sidebar/constants
 */

import { ComponentDefinition } from '@shared/schema';
import { textMessage } from './massive/messages';
import { startCommand, helpCommand, settingsCommand, menuCommand, customCommand } from './massive/commands';
import { broadcastNode } from '@/components/editor/canvas/canvas-node/broadcast-node';

/**
 * Группировка компонентов по категориям для удобной навигации
 * Разделяет компоненты на логические группы в интерфейсе
 */
export const componentCategories: Array<{
  /** Название категории */
  title: string;
  /** Компоненты в категории */
  components: ComponentDefinition[];
}> = [
  {
    title: 'Сообщения',
    components: [textMessage]
  },
  {
    title: 'Команды',
    components: [startCommand, helpCommand, settingsCommand, menuCommand, customCommand]
  },
  {
    title: 'Рассылка',
    components: [broadcastNode]
  }
];
