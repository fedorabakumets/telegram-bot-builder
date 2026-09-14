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
import { commandTrigger, textTrigger, anyMessageTrigger, groupMessageTrigger, memberTrigger, callbackTrigger, incomingCallbackTrigger, outgoingMessageTrigger, managedBotUpdatedTrigger, scheduleTrigger, apiTrigger, successfulPaymentTrigger } from './massive/triggers';
import { apiResponseNode } from './massive/api-response/api-response-node';
import { conditionNode, setVariableNode, loopNode, delayNode, codeNode, parallelSplitNode, stopProcessingNode, rateCounterNode } from './massive/logic';
import { forwardMessage, createForumTopicNode, deleteMessage } from './massive/content-management';
import { httpRequestNode } from './massive/http-request';
import { psqlQueryNode } from './massive/psql-query';
import { botTableNode } from './massive/bot-table';
import { convertFileNode } from './massive/convert-file';
import { getManagedBotTokenNode } from './massive/managed-bots';
import { answerCallbackQueryNode, editMessageNode } from './massive/actions';
import { userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger } from './massive/userbot';
import { banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights } from './massive/user-management';
import { commentNode } from './massive/utility';
import { sendInvoiceNode, createInvoiceLinkNode, refundStarsNode } from './massive/payments';

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
    components: [commandTrigger, textTrigger, anyMessageTrigger, outgoingMessageTrigger, textMessage, mediaMessage, saveAnswerNode, editMessageNode, deleteMessage, forwardMessage]
  },
  {
    title: 'Клавиатура',
    components: [callbackTrigger, incomingCallbackTrigger, keyboardMessage, answerCallbackQueryNode]
  },
  {
    title: 'Группы',
    components: [groupMessageTrigger, memberTrigger, createForumTopicNode]
  },
  {
    title: 'Модерация',
    components: [banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights]
  },
  {
    title: 'Автоматизация',
    components: [scheduleTrigger]
  },
  {
    title: 'Внешний API',
    components: [apiTrigger, apiResponseNode]
  },
  {
    title: 'Платежи',
    components: [sendInvoiceNode, createInvoiceLinkNode, refundStarsNode, successfulPaymentTrigger]
  },
  {
    title: 'Интеграции',
    components: [httpRequestNode, psqlQueryNode, botTableNode, convertFileNode, conditionNode, setVariableNode, loopNode, delayNode, codeNode, parallelSplitNode, stopProcessingNode, rateCounterNode]
  },
  {
    title: 'Юзербот',
    components: [userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger]
  },
  {
    title: 'Утилиты',
    components: [commentNode]
  }
];

/** Пресеты команд — отдельная секция, создающая пары command_trigger + message */
export const commandPresets: CommandPreset[] = allCommandPresets;
