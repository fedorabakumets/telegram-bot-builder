/**
 * @fileoverview Константы для sidebar редактора ботов
 * Группировка: 3 главные категории → подкатегории → ноды
 * @module components/editor/sidebar/constants
 */

import { ComponentDefinition } from '@shared/schema';
import { textMessage, mediaMessage, keyboardMessage, saveAnswerNode } from './massive/messages';
import { allCommandPresets } from './massive/commands';
import type { CommandPreset } from './massive/commands';
import {
  commandTrigger, textTrigger, anyMessageTrigger, groupMessageTrigger, memberTrigger,
  callbackTrigger, incomingCallbackTrigger, outgoingMessageTrigger, scheduleTrigger,
  apiTrigger, successfulPaymentTrigger,
} from './massive/triggers';
import { apiResponseNode } from './massive/api-response/api-response-node';
import {
  conditionNode, setVariableNode, loopNode, delayNode, codeNode,
  parallelSplitNode, stopProcessingNode, rateCounterNode,
} from './massive/logic';
import { forwardMessage, createForumTopicNode, deleteMessage } from './massive/content-management';
import { httpRequestNode } from './massive/http-request';
import { psqlQueryNode } from './massive/psql-query';
import { botTableNode } from './massive/bot-table';
import { convertFileNode } from './massive/convert-file';
import { answerCallbackQueryNode, editMessageNode } from './massive/actions';
import { userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger } from './massive/userbot';
import {
  banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights,
} from './massive/user-management';
import { commentNode } from './massive/utility';
import {
  sendInvoiceNode, createInvoiceLinkNode, refundStarsNode,
  editStarSubscriptionNode, getStarBalanceNode,
} from './massive/payments';

/** Подкатегория палитры (бывшая плоская категория) */
export interface PaletteSubcategory {
  /** Название подкатегории */
  title: string;
  /** Краткое пояснение подкатегории */
  description?: string;
  /** Компоненты в подкатегории */
  components: ComponentDefinition[];
}

/** Главная категория палитры */
export interface PaletteMainCategory {
  /** Название главной категории */
  title: string;
  /** Иконка FontAwesome */
  icon: string;
  /** Пояснение, что это за группа */
  description: string;
  /** Подкатегории */
  subcategories: PaletteSubcategory[];
}

/**
 * Три главные категории: Bot API, Userbot API, остальное.
 * Старые группы стали подкатегориями.
 */
export const componentCategories: PaletteMainCategory[] = [
  {
    title: 'Telegram Bot API',
    icon: 'fab fa-telegram-plane',
    description: 'Обычный бот: входящие события и ответы через Bot API',
    subcategories: [
      {
        title: 'Сообщения',
        description: 'Триггеры и отправка сообщений',
        components: [
          commandTrigger, textTrigger, anyMessageTrigger, outgoingMessageTrigger,
          textMessage, mediaMessage, saveAnswerNode, editMessageNode, deleteMessage, forwardMessage,
        ],
      },
      {
        title: 'Клавиатура',
        description: 'Кнопки и callback',
        components: [callbackTrigger, incomingCallbackTrigger, keyboardMessage, answerCallbackQueryNode],
      },
      {
        title: 'Группы',
        description: 'Чаты, участники, темы форума',
        components: [groupMessageTrigger, memberTrigger, createForumTopicNode],
      },
      {
        title: 'Модерация',
        description: 'Права и ограничения участников',
        components: [banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights],
      },
      {
        title: 'Автоматизация',
        description: 'Запуск по расписанию',
        components: [scheduleTrigger],
      },
      {
        title: 'Платежи',
        description: 'Счета, Stars и подписки',
        components: [
          sendInvoiceNode, createInvoiceLinkNode, refundStarsNode,
          editStarSubscriptionNode, getStarBalanceNode, successfulPaymentTrigger,
        ],
      },
    ],
  },
  {
    title: 'Userbot Telegram API',
    icon: 'fas fa-user-secret',
    description: 'Действия от имени пользовательского аккаунта (MTProto)',
    subcategories: [
      {
        title: 'Юзербот',
        description: 'Сообщения, кнопки и реакции юзербота',
        components: [userbotMessage, userbotClickButton, userbotInlineQuery, userbotEditTrigger],
      },
    ],
  },
  {
    title: 'Остальное',
    icon: 'fas fa-puzzle-piece',
    description: 'Логика сценария, интеграции и служебные блоки',
    subcategories: [
      {
        title: 'Внешний API',
        description: 'HTTP-вход и ответ наружу',
        components: [apiTrigger, apiResponseNode],
      },
      {
        title: 'Интеграции',
        description: 'Запросы, таблицы, условия и код',
        components: [
          httpRequestNode, psqlQueryNode, botTableNode, convertFileNode,
          conditionNode, setVariableNode, loopNode, delayNode, codeNode,
          parallelSplitNode, stopProcessingNode, rateCounterNode,
        ],
      },
      {
        title: 'Утилиты',
        description: 'Заметки на холсте',
        components: [commentNode],
      },
    ],
  },
];

/**
 * Плоский список подкатегорий (для поиска, админки, тестов)
 * @param categories - Главные категории
 * @returns Подкатегории без группировки
 */
export function flattenPaletteSubcategories(
  categories: PaletteMainCategory[] = componentCategories,
): PaletteSubcategory[] {
  return categories.flatMap((main) => main.subcategories);
}

/** Пресеты команд — отдельная секция внутри Telegram Bot API */
export const commandPresets: CommandPreset[] = allCommandPresets;
