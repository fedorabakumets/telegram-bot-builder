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
import { commandTrigger, textTrigger, anyMessageTrigger, groupMessageTrigger, callbackTrigger, incomingCallbackTrigger, outgoingMessageTrigger, managedBotUpdatedTrigger, scheduleTrigger } from './massive/triggers';
import { conditionNode, setVariableNode, loopNode, delayNode } from './massive/logic';
import { forwardMessage, createForumTopicNode } from './massive/content-management';
import { httpRequestNode } from './massive/http-request';
import { psqlQueryNode } from './massive/psql-query';
import { botTableNode } from './massive/bot-table';
import { convertFileNode } from './massive/convert-file';
import { getManagedBotTokenNode } from './massive/managed-bots';
import { answerCallbackQueryNode, editMessageNode } from './massive/actions';
import { userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger } from './massive/userbot';

/**
 * Группировка компонентов по категориям для удобной навигации
 * Триггеры распределены по категориям в соответствии с контекстом использования
 */
export const componentCategories: Array<{
  /** Название категории */
  title: string;
  /** Компоненты в категории */
  components: ComponentDefinition[];
}> = [
  {
    title: 'Сообщения',
    components: [commandTrigger, textTrigger, anyMessageTrigger, outgoingMessageTrigger, textMessage, mediaMessage, saveAnswerNode, editMessageNode, forwardMessage]
  },
  {
    title: 'Клавиатура',
    components: [callbackTrigger, incomingCallbackTrigger, keyboardMessage, answerCallbackQueryNode]
  },
  {
    title: 'Группы',
    components: [groupMessageTrigger, createForumTopicNode]
  },
  {
    title: 'Автоматизация',
    components: [scheduleTrigger]
  },
  {
    title: 'Интеграции',
    components: [httpRequestNode, psqlQueryNode, botTableNode, convertFileNode, conditionNode, setVariableNode, loopNode, delayNode]
  },
  {
    title: 'Юзербот',
    components: [userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger]
  }
];

/** Пресеты команд — отдельная секция, создающая пары command_trigger + message */
export const commandPresets: CommandPreset[] = allCommandPresets;
