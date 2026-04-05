/**
 * @fileoverview Константы для sidebar редактора ботов
 * Содержит группировки компонентов и другие константы
 * @module components/editor/sidebar/constants
 */

import { ComponentDefinition } from '@shared/schema';
import { textMessage, mediaMessage, keyboardMessage, saveAnswerNode } from './massive/messages';
import { allCommandPresets } from './massive/commands';
import type { CommandPreset } from './massive/commands';
import { broadcastNode } from '@/components/editor/canvas/canvas-node/broadcast-node';
import { commandTrigger, textTrigger, anyMessageTrigger, groupMessageTrigger, callbackTrigger, incomingCallbackTrigger, outgoingMessageTrigger, managedBotUpdatedTrigger } from './massive/triggers';
import { conditionNode } from './massive/logic';
import { forwardMessage, createForumTopicNode } from './massive/content-management';
import { httpRequestNode } from './massive/http-request';

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
    components: [commandTrigger, textTrigger, anyMessageTrigger, groupMessageTrigger, callbackTrigger, incomingCallbackTrigger, outgoingMessageTrigger, managedBotUpdatedTrigger]
  },
  {
    title: 'Сообщения',
    components: [textMessage, mediaMessage, keyboardMessage]
  },
  {
    title: 'Ввод',
    components: [saveAnswerNode]
  },
  {
    title: 'Рассылка',
    components: [broadcastNode]
  },
  {
    title: 'Логика',
    components: [conditionNode]
  },
  {
    title: 'Управление контентом',
    components: [forwardMessage, createForumTopicNode]
  },
  {
    title: 'Интеграции',
    components: [httpRequestNode]
  }
];

/** Пресеты команд — отдельная секция, создающая пары command_trigger + message */
export const commandPresets: CommandPreset[] = allCommandPresets;
