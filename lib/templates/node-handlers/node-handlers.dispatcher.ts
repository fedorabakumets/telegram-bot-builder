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
import { NODE_TYPES } from '../../bot-generator/types';
import { generateBroadcastHandler, generateStickerHandler, generateVoiceHandler, generateCommandHandler, generateStartHandler, resolveMediaUrls } from './node-handlers.renderer';
import { sortButtonsByLayout } from '../keyboard/keyboard.renderer';
import { generateMessage } from '../message/message.renderer';
import { generateContactHandler, generateLocationHandler } from './contact-location.renderer';
import { generateMessageHandlerFromNode } from '../message-handler';
import { processCodeWithAutoComments } from '../../bot-generator/core/generated-comment';
import { generateUserHandlerFromNode } from '../user-handler';
import { generateAnimationHandler } from '../animation-handler/animation-handler.renderer';
import { generateAdminRightsFromNode } from '../admin-rights/admin-rights.renderer';
import { collectSynonymEntries } from '../synonyms/synonyms.renderer';
import { generateCommandTriggerHandlers } from '../command-trigger/command-trigger.renderer';
import { generateTextTriggerHandlers } from '../text-trigger/text-trigger.renderer';
import { generateConditionHandlers } from '../condition/condition.renderer';

/**
 * Проверяет, использует ли текст переменные {user_ids} или {user_ids_count}
 */
function hasUserIdsVar(text: string): boolean {
  return /\{user_ids(?:_count)?\}/.test(text || '');
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
 * const nodes = [{ id: 'start', type: 'start' }, { id: 'help', type: 'command' }];
 * const code = generateNodeHandlers(nodes, true, true);
 */
export function generateNodeHandlers(nodes: Node[], userDatabaseEnabled: boolean, enableComments: boolean = true): string {
  // Собираем код в массив строк
  const codeLines: string[] = [];

  // Создаем mediaVariablesMap для всех узлов (используется старыми обработчиками)

  // Создаем массив всех ID узлов для генерации коротких ID (используется старыми обработчиками)

  const nodeHandlers: Record<string, (node: Node) => string> = {
    start: (node) => generateStartHandler(node, userDatabaseEnabled),
    command: (node) => generateCommandHandler(node, userDatabaseEnabled),
    message: (node) => {
      const media = resolveMediaUrls(node.data);
      return generateMessage({
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
        enableAutoTransition: node.data?.enableAutoTransition || false,
        autoTransitionTo: node.data?.autoTransitionTo,
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
        enableConditionalMessages: node.data?.enableConditionalMessages || false,
        conditionalMessages: node.data?.conditionalMessages || [],
        fallbackMessage: node.data?.fallbackMessage,
        synonymEntries: collectSynonymEntries([node]),
        hasUserIdsVariable: hasUserIdsVar(node.data?.messageText || ''),
        hasHideAfterClickIncoming: nodes.some((n: Node) =>
          (n.data?.buttons || []).some((btn: any) => btn.hideAfterClick === true && btn.target === node.id)
        ),
      });
    },
    sticker: generateStickerHandler,
    voice: generateVoiceHandler,
    animation: (node) => generateAnimationHandler({
      nodeId: node.id,
      animationUrl: node.data?.animationUrl || '',
    }),
    location: generateLocationHandler,
    contact: generateContactHandler,
    pin_message: generateMessageHandlerFromNode,
    unpin_message: generateMessageHandlerFromNode,
    delete_message: generateMessageHandlerFromNode,
    ban_user: generateUserHandlerFromNode,
    unban_user: generateUserHandlerFromNode,
    mute_user: generateUserHandlerFromNode,
    unmute_user: generateUserHandlerFromNode,
    kick_user: generateUserHandlerFromNode,
    promote_user: generateUserHandlerFromNode,
    demote_user: generateUserHandlerFromNode,
    admin_rights: generateAdminRightsFromNode,
    broadcast: (node) => generateBroadcastHandler(node, nodes, enableComments),
  };

  // Проверяем, есть ли узлы типа 'start' или синонимы для них
  const hasStartNodeType = nodes.some((node: Node) => node.type === NODE_TYPES.START);
  const hasStartSynonyms = nodes.some((node: Node) =>
    node.type === NODE_TYPES.START && node.data?.synonyms && node.data.synonyms.length > 0
  );

  // Если есть узел типа 'start' или синонимы для него, обязательно генерируем start_handler
  if (hasStartNodeType || hasStartSynonyms) {
    const startNode = nodes.find((node: Node) => node.type === NODE_TYPES.START) || {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        options: [],
        keyboardType: 'none',
        buttons: [],
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        formatMode: 'none',
        synonyms: [],
        adminOnly: false,
        requiresAuth: false,
        showInMenu: true,
        enableStatistics: true,
        customParameters: [],
        messageIdSource: 'last_message',
        disableNotification: false,
        userIdSource: 'last_message',
        mapService: 'custom',
        mapZoom: 15,
        showDirections: false,
        generateMapPreview: true,
        inputType: 'text',
        responseType: 'text',
        responseOptions: [],
        allowMultipleSelection: false,
        allowsMultipleAnswers: false,
        anonymousVoting: true,
        inputRequired: true,
        enableConditionalMessages: false,
        conditionalMessages: [],
        collectUserInput: false,
        inputButtonType: 'inline',
        enableAutoTransition: false,
        enableUserActions: false,
        saveToDatabase: false,
        allowSkip: false,
      }
    } as unknown as Node;
    codeLines.push(`\n# @@NODE_START:${startNode.id}@@\n`);

    const startHandler = nodeHandlers['start'];
    if (startHandler) {
      const handlerCode = startHandler(startNode);
      // Разбиваем код обработчика на строки и добавляем в codeLines
      handlerCode.split('\n').forEach(line => codeLines.push(line));
    }

    codeLines.push(`# @@NODE_END:${startNode.id}@@`);
  }

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

  // --- Обработчики узлов условия ---
  const conditionCode = generateConditionHandlers(nodes);
  if (conditionCode) {
    codeLines.push('\n# Обработчики узлов условия');
    conditionCode.split('\n').forEach(line => codeLines.push(line));
  }

  nodes.forEach((node: Node) => {
    // Пропускаем узлы типа 'start', так как они уже обработаны выше
    if (node.type === NODE_TYPES.START) {
      return;
    }

    // Пропускаем триггеры — они уже обработаны выше
    if (node.type === 'command_trigger' || node.type === 'text_trigger') {
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