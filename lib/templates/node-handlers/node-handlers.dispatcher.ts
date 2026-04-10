/**
 * @fileoverview Утилита для генерации обработчиков узлов Telegram-бота
 *
 * Этот модуль предоставляет функции для генерации Python-кода,
 * реализующего обработчики для различных типов узлов в графе
 * Telegram-бота. Поддерживает команды, медиа-сообщения, действия
 * с пользователями и сообщениями.
 *
 * @module generateNodeHandlers
 */

import { Node } from '@shared/schema';
import { generateBroadcastHandler, generateStickerHandler, generateVoiceHandler, resolveMediaUrls, isLocalUploadPath } from './node-handlers.renderer';
import { sortButtonsByLayout } from '../keyboard/keyboard.renderer';
import { generateMessage } from '../message/message.renderer';
import { generateContactHandler, generateLocationHandler } from './contact-location.renderer';
import { generateMessageHandlerFromNode } from '../message-handler';
/** Генератор callback-обработчика для узла пересылки сообщений */
import { generateForwardMessageFromNode } from '../forward-message';
/** Генератор callback-обработчика для узла создания топика в форуме */
import { generateCreateForumTopicFromNode } from '../create-forum-topic';
/** Генератор callback-обработчика для узла HTTP запроса */
import { generateHttpRequestFromNode } from '../http-request';
import { processCodeWithAutoComments } from '../../bot-generator/core/generated-comment';
import { generateUserHandlerFromNode } from '../user-handler';
import { generateAnimationHandler } from '../animation-handler/animation-handler.renderer';
import { generateAdminRightsFromNode } from '../admin-rights/admin-rights.renderer';
import { collectSynonymEntries } from '../synonyms/synonyms.renderer';
import { generateCommandTriggerHandlers } from '../command-trigger/command-trigger.renderer';
import { generateTextTriggerHandlers } from '../text-trigger/text-trigger.renderer';
import { generateCallbackTriggerHandlers } from '../callback-trigger/callback-trigger.renderer';
import { generateIncomingMessageTriggerHandlers } from '../incoming-message-trigger/incoming-message-trigger.renderer';
import { generateIncomingCallbackTriggerHandlers } from '../incoming-callback-trigger/incoming-callback-trigger.renderer';
import { generateOutgoingMessageTriggerHandlers } from '../outgoing-message-trigger/outgoing-message-trigger.renderer';
import { generateManagedBotUpdatedTriggerHandlers } from '../managed-bot-updated-trigger/managed-bot-updated-trigger.renderer';
import { generateAnswerCallbackQuery } from '../answer-callback-query/answer-callback-query.renderer';
import { generateEditMessageHandlers } from '../edit-message';
import { generateGetManagedBotToken } from '../get-managed-bot-token/get-managed-bot-token.renderer';
import { generateGroupMessageTriggerHandlers } from '../group-message-trigger';
import { generateConditionHandlers } from '../condition/condition.renderer';
import { generateMediaNode } from '../media-node';
import { generateUserInputNodeHandler } from '../user-input';

/**
 * Проверяет, использует ли текст переменные {user_ids} или {user_ids_count}
 */
function hasUserIdsVar(text: string): boolean {
  return /\{user_ids(?:_count)?\}/.test(text || '');
}

/**
 * @deprecated Больше не используется — виртуальные callback_trigger обработчики
 * генерируются через collectVirtualCallbackTriggerEntries в callback-trigger.renderer.ts.
 * Оставлена для обратной совместимости, будет удалена в следующей версии.
 *
 * Ищет customCallbackData среди кнопок всех узлов, ведущих к указанному nodeId.
 * @param nodeId - ID целевого узла
 * @param nodes - Массив всех узлов проекта
 * @returns Кастомный callback_data или undefined
 */
function findCustomCallbackPatternForNode(nodeId: string, nodes: Node[]): string | undefined {
  for (const node of nodes) {
    const buttons: any[] = node.data?.buttons || [];
    for (const btn of buttons) {
      if (
        btn.target === nodeId &&
        (btn.action === 'goto' || btn.action === 'command') &&
        btn.customCallbackData
      ) {
        return btn.customCallbackData as string;
      }
    }
  }
  return undefined;
}

function getSafeAutoTransitionParams(node: Node, nodes: Node[]): {
  enableAutoTransition: boolean;
  autoTransitionTo?: string;
} {
  const explicitAutoTransitionTo = typeof node.data?.autoTransitionTo === 'string'
    ? node.data.autoTransitionTo.trim()
    : '';

  if (node.data?.enableAutoTransition && explicitAutoTransitionTo) {
    // Проверяем что целевой узел существует в проекте
    const targetExists = nodes.some(n => n != null && n.id === explicitAutoTransitionTo);
    if (targetExists) {
      return {
        enableAutoTransition: true,
        autoTransitionTo: explicitAutoTransitionTo,
      };
    }
  }

  const linkedForwardNode = nodes.find((candidate) =>
    candidate.type === 'forward_message' &&
    typeof candidate.data?.sourceMessageNodeId === 'string' &&
    candidate.data.sourceMessageNodeId.trim() === node.id
  );

  if (linkedForwardNode) {
    return {
      enableAutoTransition: true,
      autoTransitionTo: linkedForwardNode.id,
    };
  }

  return {
    enableAutoTransition: false,
    autoTransitionTo: undefined,
  };
}

/**
 * Генерирует безопасный no-op обработчик для keyboard-ноды.
 *
 * Keyboard-нода в новой модели используется только как отдельный узел привязки.
 * На уровне генератора она не должна отправлять самостоятельное сообщение.
 *
 * @param node - Узел keyboard
 * @returns Python-код обработчика keyboard-ноды
 */
function generateKeyboardHandler(node: Node): string {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  return [
    `@dp.callback_query(lambda c: c.data == "${node.id}")`,
    `async def handle_callback_${safeName}(callback_query: types.CallbackQuery):`,
    `    """Обработчик keyboard-ноды ${node.id} без самостоятельной отправки сообщения."""`,
    `    try:`,
    `        user_id = callback_query.from_user.id`,
    `        logging.info(f"⌨️ Keyboard node ${node.id} вызвана для пользователя {user_id}")`,
    `    except Exception as e:`,
    `        logging.error(f"❌ Ошибка в keyboard node ${node.id}: {e}")`,
    `        return`,
    `    return`,
  ].join('\n');
}

function generateCommandEntryHandler(node: Node, callbackHandlerCode: string): string {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const rawCommand = String(node.data?.command || '').trim();
  const commandName = rawCommand.replace(/^\//, '') || safeName;
  const entryHandlerName = node.type === 'start' ? 'start_handler' : `${commandName}_handler`;

  return [
    callbackHandlerCode,
    '',
    `@dp.message(Command("${commandName}"))`,
    `async def ${entryHandlerName}(message: types.Message):`,
    `    """Точка входа для команды /${commandName}, перенаправляет в callback-обработчик узла ${node.id}."""`,
    '    class FakeCallbackQuery:',
    '        def __init__(self, message: types.Message, data: str):',
    '            self.from_user = message.from_user',
    '            self.message = message',
    '            self.data = data',
    '            self.chat = message.chat',
    '            self.date = message.date',
    '            self.message_id = message.message_id',
    '',
    '        async def answer(self, *args, **kwargs):',
    '            return None',
    '',
    `    fake_callback = FakeCallbackQuery(message, "${node.id}")`,
    `    await handle_callback_${safeName}(fake_callback)`,
  ].join('\n');
}

/**
 * Генерирует обработчики для каждого узла
 *
 * Функция проходит по всем узлам графа и генерирует соответствующие обработчики
 * на основе типа узла. Поддерживает различные типы узлов: команды, медиа, сообщения,
 * действия с пользователями и сообщениями.
 *
 * @param nodes - Массив узлов для генерации обработчиков
 * @param userDatabaseEnabled - Флаг, указывающий, включена ли база данных пользователей
 * @returns Сгенерированный код обработчиков узлов
 *
 * @example
 * const nodes = [{ id: 'welcome', type: 'message' }, { id: 'help-trigger', type: 'command_trigger' }];
 * const code = generateNodeHandlers(nodes, true, true);
 */
export function generateNodeHandlers(nodes: Node[], userDatabaseEnabled: boolean, enableComments: boolean = true): string {
  // Собираем код в массив строк
  const codeLines: string[] = [];

  // Создаем mediaVariablesMap для всех узлов (используется старыми обработчиками)

  // Создаем массив всех ID узлов для генерации коротких ID (используется старыми обработчиками)

  const buildMessageHandlerParams = (node: Node) => {
      const autoTransition = getSafeAutoTransitionParams(node, nodes);
      const media = resolveMediaUrls(node.data);
      return {
        nodeId: node.id,
        messageText: node.data?.messageText || '',
        adminOnly: node.data?.adminOnly || false,
        requiresAuth: node.data?.requiresAuth || false,
        userDatabaseEnabled,
        allowMultipleSelection: node.data?.allowMultipleSelection || false,
        multiSelectVariable: node.data?.multiSelectVariable,
        buttons: sortButtonsByLayout(node.data?.buttons || [], node.data?.keyboardLayout),
        keyboardType: node.data?.keyboardType || 'none',
        keyboardLayout: node.data?.keyboardLayout,
        oneTimeKeyboard: node.data?.oneTimeKeyboard ?? false,
        resizeKeyboard: node.data?.resizeKeyboard ?? true,
        enableAutoTransition: autoTransition.enableAutoTransition,
        autoTransitionTo: autoTransition.autoTransitionTo,
        collectUserInput: node.data?.collectUserInput || false,
        enableTextInput: node.data?.enableTextInput ?? true,
        enablePhotoInput: node.data?.enablePhotoInput || false,
        enableVideoInput: node.data?.enableVideoInput || false,
        enableAudioInput: node.data?.enableAudioInput || false,
        enableDocumentInput: node.data?.enableDocumentInput || false,
        inputVariable: node.data?.inputVariable || 'input',
        inputTargetNodeId: node.data?.inputTargetNodeId || '',
        minLength: node.data?.minLength ?? 0,
        maxLength: node.data?.maxLength ?? 0,
        appendVariable: node.data?.appendVariable ?? false,
        validationType: (node.data as any)?.validationType || 'none',
        retryMessage: (node.data as any)?.retryMessage || 'Пожалуйста, попробуйте еще раз.',
        successMessage: node.data?.successMessage || '',
        saveToDatabase: node.data?.saveToDatabase ?? true,
        photoInputVariable: node.data?.photoInputVariable || '',
        videoInputVariable: node.data?.videoInputVariable || '',
        audioInputVariable: node.data?.audioInputVariable || '',
        documentInputVariable: node.data?.documentInputVariable || '',
        formatMode: (['html', 'markdown', 'none'].includes(node.data?.formatMode)) ? node.data.formatMode : (node.data?.markdown ? 'markdown' : 'none'),
        imageUrl: media.imageUrl,
        documentUrl: media.documentUrl,
        videoUrl: media.videoUrl,
        audioUrl: media.audioUrl,
        attachedMedia: media.attachedMediaUrls,
        isLocalImageUrl: media.isLocalImageUrl,
        isLocalVideoUrl: media.isLocalVideoUrl,
        isLocalAudioUrl: media.isLocalAudioUrl,
        isLocalDocumentUrl: media.isLocalDocumentUrl,
        enableConditionalMessages: node.data?.enableConditionalMessages || false,
        conditionalMessages: node.data?.conditionalMessages || [],
        fallbackMessage: node.data?.fallbackMessage,
        synonymEntries: collectSynonymEntries([node]),
        hasUserIdsVariable: hasUserIdsVar(node.data?.messageText || ''),
        hasHideAfterClickIncoming: nodes.some((n: Node) =>
          (n.data?.buttons || []).some((btn: any) => btn.hideAfterClick === true && btn.target === node.id)
        ),
        // callbackPattern: удалён — виртуальные триггеры теперь генерируются через collectVirtualCallbackTriggerEntries
        messageSendRecipients: (node.data as any)?.messageSendRecipients || [],
        saveMessageIdTo: (node.data as any)?.saveMessageIdTo || undefined,
      };
  };

  const nodeHandlers: Record<string, (node: Node) => string> = {
    message: (node) => generateMessage(buildMessageHandlerParams(node)),
    start: (node) => generateCommandEntryHandler(node, generateMessage(buildMessageHandlerParams(node))),
    command: (node) => generateCommandEntryHandler(node, generateMessage(buildMessageHandlerParams(node))),
    sticker: generateStickerHandler,
    voice: generateVoiceHandler,
    animation: (node) => generateAnimationHandler({
      nodeId: node.id,
      animationUrl: node.data?.animationUrl || '',
      isLocalAnimationUrl: isLocalUploadPath(node.data?.animationUrl || ''),
    }),
    location: generateLocationHandler,
    contact: generateContactHandler,
    pin_message: generateMessageHandlerFromNode,
    unpin_message: generateMessageHandlerFromNode,
    delete_message: generateMessageHandlerFromNode,
    /** Обработчик узла пересылки сообщений */
    forward_message: generateForwardMessageFromNode,
    /** Обработчик узла создания топика в форуме Telegram */
    create_forum_topic: (node) => generateCreateForumTopicFromNode(node, { allNodes: nodes }),
    /** Обработчик узла HTTP запроса */
    http_request: (node) => generateHttpRequestFromNode(node, { allNodes: nodes }),
    ban_user: generateUserHandlerFromNode,
    unban_user: generateUserHandlerFromNode,
    mute_user: generateUserHandlerFromNode,
    unmute_user: generateUserHandlerFromNode,
    kick_user: generateUserHandlerFromNode,
    promote_user: generateUserHandlerFromNode,
    demote_user: generateUserHandlerFromNode,
    admin_rights: generateAdminRightsFromNode,
    broadcast: (node) => generateBroadcastHandler(node, nodes, enableComments),
    keyboard: generateKeyboardHandler,
    input: generateUserInputNodeHandler,
    answer_callback_query: (node) => {
      const entry = {
        nodeId: node.id,
        targetNodeId: (node.data as any)?.autoTransitionTo || '',
        targetNodeType: nodes.find(n => n.id === (node.data as any)?.autoTransitionTo)?.type || 'message',
        notificationText: (node.data as any)?.callbackNotificationText || '',
        showAlert: (node.data as any)?.callbackShowAlert ?? false,
        cacheTime: (node.data as any)?.callbackCacheTime ?? 0,
      };
      return generateAnswerCallbackQuery({ entries: [entry] });
    },
    get_managed_bot_token: (node) => {
      const entry = {
        nodeId: node.id,
        targetNodeId: (node.data as any)?.autoTransitionTo || '',
        targetNodeType: nodes.find(n => n.id === (node.data as any)?.autoTransitionTo)?.type || 'message',
        botIdSource: (node.data as any)?.botIdSource || 'variable',
        botIdVariable: (node.data as any)?.botIdVariable || 'bot_id',
        botIdManual: (node.data as any)?.botIdManual || '',
        saveTokenTo: (node.data as any)?.saveTokenTo || 'bot_token',
        saveErrorTo: (node.data as any)?.saveErrorTo || undefined,
      };
      return generateGetManagedBotToken({ entries: [entry] });
    },
    media: (node) => generateMediaNode({
      ...getSafeAutoTransitionParams(node, nodes),
      nodeId: node.id,
      attachedMedia: node.data?.attachedMedia || [],
      /** Список получателей медиа-сообщения */
      messageSendRecipients: (node.data as any)?.messageSendRecipients || [],
    }),
  };

  // --- Обработчики командных триггеров ---
  const commandTriggerCode = generateCommandTriggerHandlers(nodes);
  if (commandTriggerCode) {
    codeLines.push('\n# Обработчики командных триггеров');
    commandTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики текстовых триггеров ---
  const textTriggerCode = generateTextTriggerHandlers(nodes);
  if (textTriggerCode) {
    codeLines.push('\n# Обработчики текстовых триггеров');
    textTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики триггеров inline-кнопок ---
  const callbackTriggerCode = generateCallbackTriggerHandlers(nodes);
  if (callbackTriggerCode) {
    codeLines.push('\n# Обработчики триггеров inline-кнопок');
    callbackTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Middleware триггеров входящих сообщений ---
  const incomingMessageTriggerCode = generateIncomingMessageTriggerHandlers(nodes);
  if (incomingMessageTriggerCode) {
    codeLines.push('\n# Middleware триггеров входящих сообщений');
    incomingMessageTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Middleware триггеров входящих callback_query ---
  const incomingCallbackTriggerCode = generateIncomingCallbackTriggerHandlers(nodes);
  if (incomingCallbackTriggerCode) {
    codeLines.push('\n# Middleware триггеров входящих callback_query');
    incomingCallbackTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики триггеров исходящих сообщений ---
  const outgoingMessageTriggerCode = generateOutgoingMessageTriggerHandlers(nodes);
  if (outgoingMessageTriggerCode) {
    codeLines.push('\n# Обработчики триггеров исходящих сообщений');
    outgoingMessageTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Middleware триггеров обновления управляемого бота ---
  const managedBotUpdatedTriggerCode = generateManagedBotUpdatedTriggerHandlers(nodes);
  if (managedBotUpdatedTriggerCode) {
    codeLines.push('\n# Middleware триггеров обновления управляемого бота');
    managedBotUpdatedTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики триггеров сообщений в группе ---
  const groupMessageTriggerCode = generateGroupMessageTriggerHandlers(nodes);
  if (groupMessageTriggerCode) {
    codeLines.push('\n# Обработчики триггеров сообщений в группе');
    groupMessageTriggerCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики узлов условия ---
  const conditionCode = generateConditionHandlers(nodes);
  if (conditionCode) {
    codeLines.push('\n# Обработчики узлов условия');
    conditionCode.split('\n').forEach(line => codeLines.push(line));
  }

  // --- Обработчики узлов edit_message ---
  const editMessageCode = generateEditMessageHandlers(nodes);
  if (editMessageCode) {
    codeLines.push('\n# Обработчики узлов edit_message');
    editMessageCode.split('\n').forEach(line => codeLines.push(line));
  }

  nodes.forEach((node: Node) => {
    // Пропускаем триггеры — они уже обработаны выше
    if (node.type === 'command_trigger' || node.type === 'text_trigger' || node.type === 'incoming_message_trigger' || node.type === 'group_message_trigger' || (node.type as any) === 'callback_trigger' || (node.type as any) === 'incoming_callback_trigger' || (node.type as any) === 'outgoing_message_trigger' || (node.type as any) === 'managed_bot_updated_trigger' || (node.type as any) === 'edit_message') {
      return;
    }

    // Пропускаем condition-узлы — они уже обработаны выше
    if (node.type === 'condition') return;

    codeLines.push(`\n# @@NODE_START:${node.id}@@\n`);

    const handler = nodeHandlers[node.type];
    if (handler) {
      const handlerCode = handler(node);
      // Разбиваем код обработчика на строки и добавляем в codeLines
      handlerCode.split('\n').forEach(line => codeLines.push(line));
    } else {
      codeLines.push(`    # Нет обработчика для узла типа ${node.type}`);
    }

    codeLines.push(`# @@NODE_END:${node.id}@@`);
  });

  // Применяем автоматическое добавление комментариев ко всему коду, если включена генерация комментариев
  if (enableComments) {
    processCodeWithAutoComments(codeLines, 'generate-node-handlers.ts');
  }

  // Собираем финальный код из обработанных строк
  return codeLines.join('\n');
}
