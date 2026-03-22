/**
 * @fileoverview Константы для sidebar редактора ботов
 * Содержит группировки компонентов и другие константы
 * @module components/editor/sidebar/constants
 */

import { ComponentDefinition } from '@shared/schema';
import { textMessage } from './massive/messages';
import { allCommandPresets } from './massive/commands';
import type { CommandPreset } from './massive/commands';
import { broadcastNode } from '@/components/editor/canvas/canvas-node/broadcast-node';
import { commandTrigger, textTrigger } from './massive/triggers';

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
    title: 'Триггеры',
    components: [commandTrigger, textTrigger]
  },
  {
    title: 'Сообщения',
    components: [textMessage]
  },
  {
    title: 'Рассылка',
    components: [broadcastNode]
  }
];

/** Пресеты команд — отдельная секция, создающая пары command_trigger + message */
export const commandPresets: CommandPreset[] = allCommandPresets;
