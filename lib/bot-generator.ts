// Внешние зависимости
import { BotData, BotGroup } from '@shared/schema';

// Ядро: контекст и состояние
import { createGenerationContext } from './bot-generator/core/create-generation-context';

// Утилиты: комментарии
import { setCommentsEnabled } from './bot-generator/utils/generateGeneratedComment';
import type { GenerationOptions } from './bot-generator/core/generation-options.types';

// Ядро: логирование
import { generatorLogger } from './bot-generator/core/generator-logger';

// Типы
import { logFlowAnalysis } from './bot-generator/core';
import { generateCommandCallbackHandler } from './templates/handlers';
import { Button } from './bot-generator/types';
import {
  generateGroupBasedEventHandlers,
} from './bot-generator/handlers';
import {
  generateUserInputValidationAndContinuationLogic,
  generateAdHocInputCollectionHandler,
  generateContinuationLogicForButtonBasedInput
} from './bot-generator/input';

// Внутренние модули - использование экспорта бочек
import { generateBotCommandsSetup } from './bot-commands-setup';
import { generateBotFatherCommands } from './commands';
import { collectConditionalMessageButtons } from './bot-generator/Conditional/collectConditionalMessageButtons';
import { generateConditionalButtonHandlerCode, hasConditionalValueButtons } from './bot-generator/Conditional/conditional-button-handler';
import { generateUniversalVariableReplacement } from './bot-generator/database/generateUniversalVariableReplacement';
import { formatTextForPython } from './bot-generator/format';
import { generateDatabaseCode, generateGroupsConfiguration, generateNodeNavigation } from './generate';
import { generateSafeEditOrSend, generateHeader, generateUniversalHandlers, generateMain, generateImports, generateConfig, generateUtils } from './templates/typed-renderer';
// Примечание: generateApiConfig удалена после миграции на Jinja2
// import { generateApiConfig } from './bot-generator/api';
import { generateCompleteBotScriptFromNodeGraphWithDependencies } from './generate-complete-bot-script';
import { generateNodeHandlers } from './generate/generate-node-handlers';
import { generateKeyboard } from './templates/keyboard';
import { filterInlineNodes } from './bot-generator/Keyboard/filterInlineNodes';
import { hasInlineButtons } from './bot-generator/Keyboard/hasInlineButtons';
import { identifyNodesRequiringMultiSelectLogic } from './bot-generator/Keyboard/identifyNodesRequiringMultiSelectLogic';
import { processInlineButtonNodes } from './bot-generator/Keyboard/processInlineButtonNodes';
import { generateButtonResponse, generateMultiSelectCallback, generateMultiSelectDone, generateMultiSelectReply, generateReplyButtonHandlers } from './templates/handlers';
import { hasUrlButtons } from './bot-generator/user-input';
import { generateMessageLoggingCode } from './bot-generator/logging/generate-message-logging';
import { generateGroupHandlers } from './bot-generator/MediaHandler/generateGroupHandlers';
import { generateMediaFileFunctions } from './bot-generator/MediaHandler/generateMediaFileFunctions';
import { generateSaveMediaToDb } from './bot-generator/MediaHandler/save-media-to-db';
import { hasMediaNodes } from './bot-generator/MediaHandler/hasMediaNodes';
import { hasUploadImageUrls } from './bot-generator/MediaHandler/hasUploadImageUrls';
import { generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation } from './bot-generator/transitions';
import { newgenerateStateTransitionAndRenderLogic } from './bot-generator/transitions';
import { newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation } from './bot-generator/user-input';
import { createProcessNodeButtonsFunction } from './bot-generator/node-handlers';
import { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile } from './bot-generator/scaffolding';
import { generateSynonymHandlers } from './templates/synonyms';
import { addAutoTransitionNodes } from './bot-generator/utils/addAutoTransitionNodes';
import { addInputTargetNodes } from './bot-generator/utils/addInputTargetNodes';
import { collectInputTargetNodes } from './bot-generator/utils/collectInputTargetNodes';
import { hasAutoTransitions } from './bot-generator/utils/hasAutoTransitions';
import { hasNodesRequiringSafeEditOrSend } from './bot-generator/utils/hasNodesRequiringSafeEditOrSend';
import { assertValidPython } from './bot-generator/validation';



/**
 * Опции для генерации Python-кода бота
 */
export interface GeneratePythonCodeOptions {
  /** Имя бота */
  botName?: string;
  /** Группы бота */
  groups?: BotGroup[];
  /** Включить базу данных пользователей */
  userDatabaseEnabled?: boolean;
  /** ID проекта */
  projectId?: number | null;
  /** Включить логирование */
  enableLogging?: boolean;
  /** Включить обработчики групп */
  enableGroupHandlers?: boolean;
  /** Включить комментарии */
  enableComments?: boolean;
}

/**
 * Генерирует Python-код для Telegram бота
 * 
 * @param botData - Данные бота
 * @param options - Опции генерации
 * @returns Python код бота
 * 
 * @example
 * const code = generatePythonCode(botData, { botName: 'MyBot', enableLogging: true });
 */
export function generatePythonCode(
  botData: BotData,
  options: GeneratePythonCodeOptions = {}
): string {
  const {
    botName = 'MyBot',
    groups = [],
    userDatabaseEnabled = false,
    projectId = null,
    enableLogging = false,
    enableGroupHandlers = false,
    enableComments = true,
  } = options;

  // Синхронизируем глобальное состояние комментариев с опциями генерации
  setCommentsEnabled(enableComments);

  // Создаём опции генерации
  const genOptions: GenerationOptions = {
    enableLogging,
    enableComments,
    userDatabaseEnabled,
    enableGroupHandlers,
    projectId,
  };

  // Создаём контекст генерации
  const context = createGenerationContext(botData, botName, groups, genOptions);

  // Анализируем и логируем поток
  logFlowAnalysis(context.nodes);

  let code = '"""\n';
  code += `${context.botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';

  const botFatherCommands = generateBotFatherCommands(context.nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }

  code += '"""\n\n';

  // Добавляем UTF-8 кодировку
  code += generateHeader({});

  // Генерируем все импорты на основе типов узлов
  const hasInlineButtonsResult = hasInlineButtons(context.nodes || []);
  const hasAutoTransitionsResult = hasAutoTransitions(context.nodes || []);
  const hasMediaNodesResult = hasMediaNodes(context.nodes || []);
  const hasUploadImagesResult = hasUploadImageUrls(context.nodes || []);

  // Вычисляем параметры для новых импортов
  const hasParseModeNodesResult = (context.nodes || []).some((node) => {
    const data = node.data || {};

    // Узлы с явным formatMode
    if (
      data.formatMode &&
      (data.formatMode.toLowerCase() === 'html' ||
        data.formatMode.toLowerCase() === 'markdown')
    ) {
      return true;
    }

    // Узлы с markdown флагом
    if (data.markdown) {
      return true;
    }

    // Узлы с кнопками и форматированием
    if (
      data.buttons &&
      data.buttons.length > 0 &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown)
    ) {
      return true;
    }

    // Узлы с медиа и caption
    if (
      (data.imageUrl ||
        data.videoUrl ||
        data.audioUrl ||
        data.documentUrl) &&
      data.mediaCaption
    ) {
      return true;
    }

    // Узлы с сбором ввода и форматированием
    if (
      data.collectUserInput &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown)
    ) {
      return true;
    }

    // Узлы с условными сообщениями и форматированием
    if (
      data.enableConditionalMessages &&
      (data.formatMode === 'html' ||
        data.formatMode === 'markdown' ||
        data.markdown)
    ) {
      return true;
    }

    return false;
  });

  const hasMediaGroupsResult = (context.nodes || []).some(
    (node) =>
      node.data?.attachedMedia &&
      Array.isArray(node.data.attachedMedia) &&
      node.data.attachedMedia.length > 1
  );

  const hasUrlImagesResult = (context.nodes || []).some(
    (node) => node.data?.imageUrl && node.data.imageUrl.startsWith('http')
  );

  const hasDatetimeNodesResult = (context.nodes || []).some(
    (node) =>
      node.type === 'command' ||
      node.type === 'mute_user' ||
      node.type === 'ban_user' ||
      node.type === 'message' ||
      node.type === 'sticker' ||
      node.type === 'voice' ||
      node.type === 'animation' ||
      node.type === 'photo' ||
      node.type === 'video' ||
      node.type === 'document' ||
      node.type === 'audio' ||
      node.type === 'location' ||
      node.type === 'contact' ||
      (node as any).type === 'group_event'
  );

  const hasTimezoneNodesResult = (context.nodes || []).some(
    (node) =>
      node.type === 'photo' ||
      (node as any).type === 'group_event' ||
      (node.data && node.data.enablePhotoInput)
  );

  code += generateImports({
    userDatabaseEnabled: !!context.options.userDatabaseEnabled,
    hasInlineButtons: hasInlineButtonsResult,
    hasAutoTransitions: hasAutoTransitionsResult,
    hasMediaNodes: hasMediaNodesResult,
    hasUploadImages: hasUploadImagesResult,
    hasParseModeNodes: hasParseModeNodesResult,
    hasMediaGroups: hasMediaGroupsResult,
    hasUrlImages: hasUrlImagesResult,
    hasDatetimeNodes: hasDatetimeNodesResult,
    hasTimezoneNodes: hasTimezoneNodesResult,
  });

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  const hasNodesRequiringSafeEditOrSendResult = hasNodesRequiringSafeEditOrSend(context.nodes || []);

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  // ИЛИ если включена база данных пользователей (т.к. callback-обработчики могут использовать эту функцию)
  code += generateSafeEditOrSend({
    hasInlineButtonsOrSpecialNodes: hasInlineButtonsResult || hasNodesRequiringSafeEditOrSendResult || !!context.options.userDatabaseEnabled,
    hasAutoTransitions: hasAutoTransitionsResult || !!context.options.userDatabaseEnabled,
  });

  // Добавляем конфигурацию бота (токен, логирование, бот, диспетчер, администраторы)
  code += generateConfig({
    userDatabaseEnabled: !!context.options.userDatabaseEnabled,
    projectId: context.projectId,
  });

  // Примечание: generateApiConfig удалена после миграции на Jinja2
  // Конфигурация API теперь генерируется через lib/templates/config/config.py.jinja2

  // Генерируем логирование сообщений (только при включенной БД)
  if (context.options.userDatabaseEnabled) {
    code += generateMessageLoggingCode(context.options.userDatabaseEnabled, hasInlineButtons(context.nodes || []), context.projectId);
  }

  // Добавляем конфигурацию групп
  code += generateGroupsConfiguration(context.groups);

  // Добавляем функции для работы с базой данных
  code += generateDatabaseCode(!!context.options.userDatabaseEnabled, context.nodes || []);





  // Добавляем глобальные утилитарные функции
  // Примечание: generateGlobalCheckUserVariableFunction удалена после миграции на Jinja2
  code += generateUtils({ userDatabaseEnabled: !!context.options.userDatabaseEnabled });

  // Функции для работы с файлами - если есть медиа или узлы с изображениями из папки uploads
  // ИЛИ если включена база данных пользователей (для функции send_photo_with_logging)
  if (hasMediaNodes(context.nodes || []) || hasUploadImageUrls(context.nodes || []) || !!context.options.userDatabaseEnabled) {
    code += generateSaveMediaToDb();
    code += generateMediaFileFunctions();
  }

  // Определяем команды для меню BotFather
  const menuCommands = context.nodes.filter(node =>
    (node.type === 'start' || node.type === 'command') &&
    node.data.showInMenu &&
    node.data.command
  );

  // Настройка меню команд для BotFather
  code += generateBotCommandsSetup(menuCommands);

  // Генерируем обработчики для каждого узла
  code += generateNodeHandlers(context.nodes || [], !!context.options.userDatabaseEnabled, !!context.options.enableComments);

  // Генерируем обработчики синонимов для всех узлов
  code += generateSynonymHandlers(context.nodes || []);

  // Генерируем обработчики обратного вызова для inline кнопок И целевых узлов ввода
  const inlineNodes = filterInlineNodes(context.nodes || []);

  // Также собираем все целевые узла из коллекций пользовательского ввода
  const inputTargetNodeIds = collectInputTargetNodes(context.nodes || []);

  // Собираем все идентификаторы ссылочных узлов и кнопки условных сообщений
  let allReferencedNodeIds = new Set<string>();
  const allConditionalButtons = new Set<string>();

  // Добавляем узла из inline кнопок
  processInlineButtonNodes(inlineNodes, allReferencedNodeIds);

  // Собираем кнопки из условных сообщений
  collectConditionalMessageButtons(context.nodes || [], allConditionalButtons);

  // Добавляем целевые узла ввода
  addInputTargetNodes(inputTargetNodeIds, allReferencedNodeIds);

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем узла, которые являются целями автопереходов
  addAutoTransitionNodes(context.nodes || [], allReferencedNodeIds);

  // Добавляем все узлы в allReferencedNodeIds, чтобы для каждого узла создавался обработчик
  // Это необходимо, потому что в разных местах кода генерируются вызовы handle_callback_... для всех узлов
  context.nodes.forEach(node => {
    allReferencedNodeIds.add(node.id);
  });

  // ФИЛЬТРАЦИЯ: Убедимся, что allReferencedNodeIds содержит только реально существующие узлы
  // Это предотвращает генерацию обработчиков для удаленных или несуществующих узлов
  const existingNodeIds = new Set(context.nodes.map(node => node.id));
  const filteredReferencedNodeIds = new Set<string>();
  allReferencedNodeIds.forEach(nodeId => {
    if (existingNodeIds.has(nodeId)) {
      filteredReferencedNodeIds.add(nodeId);
    } else {
      generatorLogger.debug(`Удалён узел из allReferencedNodeIds: ${nodeId} (не найден в текущих узлах)`);
    }
  });
  allReferencedNodeIds = filteredReferencedNodeIds;

  // Генерируем обработчики только если есть inline кнопки или условные кнопки
  generateInteractiveCallbackHandlers();

  // Генерируем обработчики для кнопок клавиатуры ответов
  code += generateReplyButtonHandlers({ nodes: context.nodes, indentLevel: '' });

  // Добавляем обработчики кнопочных ответов для узлов сбора ввода
  generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard();

  // ПРИМЕЧАНИЕ: Дублирующий набор обработчиков reply-кнопок был удален
  // Теперь логика сохранения данных через waiting_for_input добавлена в первый набор обработчиков выше
  // Это исправляет проблему когда reply-кнопки не сохраняли данные пользователя

  // Добавляем универсальный обработчик пользовательского ввода только если есть сбор данных
  generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation();

  // Добавляем обработчик для условных кнопок (conditional_variableName_value) ТОЛЬКО если есть условные кнопки
  if (hasConditionalValueButtons(context.nodes)) {
    code += generateConditionalButtonHandlerCode();
  }

  // Добавляем обработчики для кнопок команд (типа cmd_start) с подробным логированием
  const commandButtons = collectAllCommandCallbacksFromNodes(context.nodes || []);

  generatorLogger.info(`Найдено кнопок команд: ${commandButtons.size}`);
  generatorLogger.debug('Список кнопок команд', Array.from(commandButtons));

  // Добавляем обработчики callback для командных кнопок через Jinja2 шаблон
  if (commandButtons.size > 0) {
    code += '\n# Обработчики для кнопок команд\n';
    code += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;

    commandButtons.forEach(commandCallback => {
      // Найти соответствующий узел команды для определения типа
      const commandNode = findCommandNode(commandCallback, context.nodes || []);
      const commandNodeType = commandNode ? (commandNode.type as 'start' | 'command') : '';
      const command = commandCallback.replace('cmd_', '');

      code += generateCommandCallbackHandler({
        callbackData: commandCallback,
        button: {
          action: 'command',
          id: `btn_${command}`,
          target: command,
          text: `Команда /${command}`,
        },
        indentLevel: '',
        commandNode: commandNodeType,
        command: command,
      });
    });
  }

  // Обработчики кнопок ответов уже добавлены выше, перед универсальным обработчиком текста
  if (!!context.options.enableGroupHandlers) {
    code += generateGroupBasedEventHandlers(context.groups, generateGroupHandlers);
  }

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  code += generateUniversalHandlers({ userDatabaseEnabled: !!context.options.userDatabaseEnabled });

  // Добавляем функцию main() из шаблона
  code += generateMain({
    userDatabaseEnabled: !!context.options.userDatabaseEnabled,
    hasInlineButtons: hasInlineButtons(context.nodes || []),
    menuCommandsCount: menuCommands.length,
  });

  // Найдем узла с множественным выбором для использования в обработчиках
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(context.nodes as any[]);

  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  code += generateMultiSelectCallback({
    multiSelectNodes: multiSelectNodes as any[],
    allNodeIds: context.allNodeIds,
    indentLevel: '    ',
  });

  const finalCode = generateCompleteBotScriptFromNodeGraphWithDependencies(
    code,
    {
      multiSelectNodes: multiSelectNodes as any[],
      allNodeIds: context.allNodeIds,
      nodes: context.nodes as any[],
      generateMultiSelectCallbackLogic: generateMultiSelectCallback as any,
      generateMultiSelectDoneHandler: generateMultiSelectDone as any,
      generateMultiSelectReplyHandler: generateMultiSelectReply as any
    }
  );

  // Валидация сгенерированного кода перед возвратом
  assertValidPython(finalCode);

  return finalCode;

  /**
   * Генерирует обработчики callback'ов для inline кнопок
   */
  function generateInteractiveCallbackHandlers(): void {
    const processNodeButtonsAndGenerateHandlers = createProcessNodeButtonsFunction(inlineNodes, context.nodes, code, context.allNodeIds, [], context.mediaVariablesMap);
    code = generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(inlineNodes, allReferencedNodeIds, allConditionalButtons, code, processNodeButtonsAndGenerateHandlers, context.nodes, context.allNodeIds, [], !!context.options.userDatabaseEnabled, context.mediaVariablesMap);
  }

  /**
   * Генерирует обработчики кнопочных ответов для сбора пользовательского ввода
   */
  function generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard() {
    const userInputNodes = context.nodes.filter(node => node.type === 'message' &&
      node.data.responseType === 'buttons' &&
      Array.isArray(node.data.responseOptions) &&
      node.data.responseOptions.length > 0
    );

    if (userInputNodes.length > 0) {
      code += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
      code += generateButtonResponse({
        userInputNodes: userInputNodes.map(node => ({
          id: node.id,
          responseOptions: node.data.responseOptions,
          allowSkip: node.data.allowSkip,
        })),
        allNodes: context.nodes,
        hasUrlButtonsInProject: hasUrlButtons(context.nodes),
        indentLevel: '',
      });
    }
  }

  /**
   * Генерирует универсальный обработчик пользовательского ввода
   * @returns {string} Python код обработчика
   */
  function generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation() {
    const adHocHandlerCode = generateAdHocInputCollectionHandler();

    // Адаптер: generateContinuationLogicForButtonBasedInput ожидает (buttons, indent, nodeId, data, allNodeIds)
    // generateKeyboard из templates ожидает KeyboardTemplateParams — оборачиваем
    const generateInlineKbAdapter = (buttons: any[], indent: string, nodeId: string, data: any, allNodeIds: string[]) =>
      generateKeyboard({ keyboardType: 'inline', buttons, nodeId, indentLevel: indent, allNodeIds });

    const continuationHandlerCode = generateContinuationLogicForButtonBasedInput(
      context.nodes || [],
      formatTextForPython,
      generateUniversalVariableReplacement,
      generateInlineKbAdapter,
      context.allNodeIds,
      generateNodeNavigation
    );
    code = newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(
      context.nodes,
      code,
      context.allNodeIds,
      [],
      () => adHocHandlerCode,
      () => continuationHandlerCode,
      generateUserInputValidationAndContinuationLogic,
      generateStateTransitionAndRenderLogic
    );
  }

  /**
   * Генерирует код валидации пользовательского ввода и логики продолжения
   */
  function generateStateTransitionAndRenderLogic() {
    code = newgenerateStateTransitionAndRenderLogic(context.nodes, code, context.allNodeIds, []);
  }

  /**
   * Собирает все callback-идентификаторы команд из узлов бота
   * @param nodes - Массив узлов бота
   * @returns {Set<string>} Уникальные callback идентификаторы команд
   */
  function collectAllCommandCallbacksFromNodes(nodes: any[]): Set<string> {
    const commandButtons = new Set<string>();

    nodes.forEach(node => {
      // Обычные кнопки узла
      if (node.data?.buttons) {
        node.data.buttons.forEach((button: Button) => {
          if (button.action === 'goto' && button.target) {
            const commandCallback = `cmd_${button.target.replace('/', '')}`;
            commandButtons.add(commandCallback);
          }
        });
      }

      // Кнопки в условных сообщениях
      if (node.data?.conditionalMessages) {
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.buttons) {
            condition.buttons.forEach((button: Button) => {
              if (button.action === 'goto' && button.target) {
                const commandCallback = `cmd_${button.target.replace('/', '')}`;
                commandButtons.add(commandCallback);
              }
            });
          }
        });
      }
    });

    return commandButtons;
  }

  /**
   * Находит узел команды по имени
   * @param commandCallback - Callback команды (cmd_xxx)
   * @param nodes - Массив узлов бота
   * @returns {any|null} Узел команды или null
   */
  function findCommandNode(commandCallback: string, nodes: any[]): any | null {
    const command = commandCallback.replace('cmd_', '');
    return nodes.find(
      n => n.data.command === `/${command}` || n.data.command === command
    ) || null;
  }
}

// Реэкспорт типов и функций для обратной совместимости
export type { Button } from './bot-generator/types';
export type { ResponseOption } from './bot-generator/types';
export { isLoggingEnabled } from './bot-generator/core';

// Повторный экспорт функций каркаса
export { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile };