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
import { generateBroadcastHandler } from '../Broadcast/generateBroadcastHandler';
import { generateCommandHandler, generateStartHandler } from '../CommandHandler';
import { generateAnimationHandler, generateContactHandler, generateLocationHandler, generateStickerHandler, generateVoiceHandler } from '../MediaHandler';
import { generateDeleteMessageHandler, generatePinMessageHandler, generateUnpinMessageHandler } from '../MessageHandler';
import {
  generateAdminRightsHandler,
  generateBanUserHandler,
  generateDemoteUserHandler,
  generateKickUserHandler,
  generateMuteUserHandler,
  generatePromoteUserHandler,
  generateUnbanUserHandler,
  generateUnmuteUserHandler
} from '../UserHandler';
import { collectMediaVariables } from '../utils/collectMediaVariables';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateBroadcastClientHandler } from './generateBroadcastClientHandler';

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
  // Собираем код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Добавляем комментарий о генерации, если включена генерация комментариев
  if (enableComments) {
    codeLines.push('# Код сгенерирован в generate-node-handlers.ts');
  }

  // Создаем mediaVariablesMap для всех узлов
  const mediaVariablesMap = collectMediaVariables(nodes);

  const nodeHandlers: Record<string, (node: Node) => string> = {
    start: (node) => generateStartHandler(node, userDatabaseEnabled, mediaVariablesMap),
    command: (node) => generateCommandHandler(node, userDatabaseEnabled, mediaVariablesMap),
    sticker: generateStickerHandler,
    voice: generateVoiceHandler,
    animation: generateAnimationHandler,
    location: generateLocationHandler,
    contact: generateContactHandler,
    pin_message: generatePinMessageHandler,
    unpin_message: generateUnpinMessageHandler,
    delete_message: generateDeleteMessageHandler,
    ban_user: generateBanUserHandler,
    unban_user: generateUnbanUserHandler,
    mute_user: generateMuteUserHandler,
    unmute_user: generateUnmuteUserHandler,
    kick_user: generateKickUserHandler,
    promote_user: generatePromoteUserHandler,
    demote_user: generateDemoteUserHandler,
    admin_rights: generateAdminRightsHandler,
    broadcast: (node) => {
      const apiType = node.data?.broadcastApiType || 'bot';
      return apiType === 'client'
        ? generateBroadcastClientHandler(node, nodes)
        : generateBroadcastHandler(node, nodes);
    },
  };

  // Проверяем, есть ли узлы типа 'start' или синонимы для них
  const hasStartNodeType = nodes.some((node: Node) => node.type === 'start');
  const hasStartSynonyms = nodes.some((node: Node) =>
    node.type === 'start' && node.data?.synonyms && node.data.synonyms.length > 0
  );

  // Если есть узел типа 'start' или синонимы для него, обязательно генерируем start_handler
  if (hasStartNodeType || hasStartSynonyms) {
    const startNode = nodes.find((node: Node) => node.type === 'start') || {
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
        isPrivateOnly: false,
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

  nodes.forEach((node: Node) => {
    // Пропускаем узлы типа 'start', так как они уже обработаны выше
    if (node.type === 'start') {
      return;
    }

    codeLines.push(`\n# @@NODE_START:${node.id}@@\n`);

    const handler = nodeHandlers[node.type];
    if (handler) {
      const handlerCode = handler(node);
      // Разбиваем код обработчика на строки и добавляем в codeLines
      handlerCode.split('\n').forEach(line => codeLines.push(line));
    } else {
      // Если нет специфического обработчика, проверим, может быть, это обычный узел сообщения
      if (node.type === 'message' || node.type === 'command') {
        // Для узлов типа message и command без медиа-контента используем стандартную логику
        codeLines.push(`    # Обработчик для узла ${node.id} типа ${node.type} будет сгенерирован отдельно`);
      } else {
        codeLines.push(`    # Нет обработчика для узла типа ${node.type}`);
      }
    }
    // Примечание: узлы ввода пользователя и сообщений обрабатываются через обработчики обратного вызова, а не как отдельные обработчики команд

    codeLines.push(`# @@NODE_END:${node.id}@@`);
  });

  // Применяем автоматическое добавление комментариев ко всему коду, если включена генерация комментариев
  const processedCode = enableComments
    ? processCodeWithAutoComments(codeLines, 'generate-node-handlers.ts')
    : codeLines;

  // Собираем финальный код из обработанных строк
  return processedCode.join('\n');
}