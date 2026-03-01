// Внешние зависимости
import { BotData, BotGroup } from '@shared/schema';

// Ядро: контекст и состояние
import { createGenerationContext } from './bot-generator/core/create-generation-context';
import { createGenerationState, withLogging, withComments } from './bot-generator/core/generation-state';
import type { GenerationContext } from './bot-generator/core/generation-context';
import type { GenerationOptions } from './bot-generator/core/generation-options.types';

// Типы
import { isLoggingEnabled, logFlowAnalysis } from './bot-generator/core';
import { generatePythonImports } from './bot-generator/imports';
import { collectAllCommandCallbacksFromNodes, addCommandCallbackHandlers } from './bot-generator/commands';
import {
  generateGroupBasedEventHandlers,
  generateFallbackHandlers,
  generateBotInitialization,
  generateSignalHandler,
  generatePollingLoop
} from './bot-generator/handlers';
import { generateMultiSelectCallbackHandler } from './bot-generator/multi-select';
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
import { generateGlobalCheckUserVariableFunction } from "./bot-generator/database/generateGlobalCheckUserVariableFunction";
import { generateUniversalVariableReplacement } from './bot-generator/database/generateUniversalVariableReplacement';
import { formatTextForPython } from './bot-generator/format';
import { extractNodesAndConnections } from './bot-generator/MediaHandler';
import { generateBasicBotSetupCode, generateDatabaseCode, generateGroupsConfiguration, generateNodeNavigation, generateSafeEditOrSendCode, generateUtf8EncodingCode, generateUtilityFunctions } from './generate';
import { generateApiConfig } from './bot-generator/api';
import { generateCompleteBotScriptFromNodeGraphWithDependencies } from './generate-complete-bot-script';
import { generateNodeHandlers } from './generate/generate-node-handlers';
import { generateInlineKeyboardCode } from './bot-generator/Keyboard';
import { filterInlineNodes } from './bot-generator/Keyboard/filterInlineNodes';
import { generateReplyButtonHandlers } from './bot-generator/Keyboard/generate-reply-button-handlers';
import { generateTransitionLogicForMultiSelectCompletion } from './bot-generator/Keyboard/generate-transition-logic-multi-select';
import { generateButtonResponseHandlers } from './bot-generator/Keyboard/generateButtonResponseHandlers';
import { generateMultiSelectCallbackLogic } from './bot-generator/Keyboard/generateMultiSelectCallbackLogic';
import { generateMultiSelectDoneHandler } from './bot-generator/Keyboard/generateMultiSelectDoneHandler';
import { generateMultiSelectReplyHandler } from './bot-generator/Keyboard/generateMultiSelectReplyHandler';
import { hasInlineButtons } from './bot-generator/Keyboard/hasInlineButtons';
import { identifyNodesRequiringMultiSelectLogic } from './bot-generator/Keyboard/identifyNodesRequiringMultiSelectLogic';
import { processInlineButtonNodes } from './bot-generator/Keyboard/processInlineButtonNodes';
import { generateMessageLoggingCode } from './bot-generator/logging/generate-message-logging';
import { generateGroupHandlers } from './bot-generator/MediaHandler/generateGroupHandlers';
import { generateMediaFileFunctions } from './bot-generator/MediaHandler/generateMediaFileFunctions';
import { hasMediaNodes } from './bot-generator/MediaHandler/hasMediaNodes';
import { hasUploadImageUrls } from './bot-generator/MediaHandler/hasUploadImageUrls';
import { generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation } from './bot-generator/transitions';
import { newgenerateStateTransitionAndRenderLogic } from './bot-generator/transitions';
import { newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation } from './bot-generator/user-input';
import { createProcessNodeButtonsFunction } from './bot-generator/node-handlers';
import { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile } from './bot-generator/scaffolding';
import { generateSynonymHandlers } from './bot-generator/Synonyms';
import { addAutoTransitionNodes } from './bot-generator/utils/addAutoTransitionNodes';
import { addInputTargetNodes } from './bot-generator/utils/addInputTargetNodes';
import { collectInputTargetNodes } from './bot-generator/utils/collectInputTargetNodes';
import { extractNodeData } from './bot-generator/utils/extractNodeData';
import { hasAutoTransitions } from './bot-generator/utils/hasAutoTransitions';
import { hasNodesRequiringSafeEditOrSend } from './bot-generator/utils/hasNodesRequiringSafeEditOrSend';
import { setCommentsEnabled } from './bot-generator/utils/generateGeneratedComment';
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
  code += generateUtf8EncodingCode();

  // Генерируем Python импорты на основе типов узлов
  const hasInlineButtonsResult = hasInlineButtons(context.nodes || []);
  code += generatePythonImports({ nodes: context.nodes || [], userDatabaseEnabled: context.options.userDatabaseEnabled, hasInlineButtons: hasInlineButtonsResult });

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  const hasAutoTransitionsResult = hasAutoTransitions(context.nodes || []);
  const hasNodesRequiringSafeEditOrSendResult = hasNodesRequiringSafeEditOrSend(context.nodes || []);

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  // ИЛИ если включена база данных пользователей (т.к. callback-обработчики могут использовать эту функцию)
  code += generateSafeEditOrSendCode(hasInlineButtonsResult || hasNodesRequiringSafeEditOrSendResult || userDatabaseEnabled, hasAutoTransitionsResult || userDatabaseEnabled);

  code += generateBasicBotSetupCode();

  // Добавляем конфигурацию API
  code += generateApiConfig(context.projectId, context.options.userDatabaseEnabled);

  // Генерируем логирование сообщений (только при включенной БД)
  if (context.options.userDatabaseEnabled) {
    code += generateMessageLoggingCode(context.options.userDatabaseEnabled, hasInlineButtons(context.nodes || []));
  }

  // Добавляем конфигурацию групп
  code += generateGroupsConfiguration(context.groups);

  // user_data всегда нужен для временного хранения состояний даже при включенной БД
  // ИСПРАВЛЕНИЕ: Создаем user_data всегда, так как он используется в callback handlers
  code += '# Хранилище пользователей (временное состояние)\n';
  code += 'user_data = {}\n\n';

  // Добавляем функции для работы с базой данных
  code += generateDatabaseCode(context.options.userDatabaseEnabled, context.nodes || []);





  // Добавляем глобальные утилитарные функции
  code += generateGlobalCheckUserVariableFunction(); // Добавляем глобальное определение функции
  code += generateUtilityFunctions(context.options.userDatabaseEnabled);

  // Функции для работы с файлами - если есть медиа или узлы с изображениями из папки uploads
  // ИЛИ если включена база данных пользователей (для функции send_photo_with_logging)
  if (hasMediaNodes(context.nodes || []) || hasUploadImageUrls(context.nodes || []) || context.options.userDatabaseEnabled) {
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
  code += generateNodeHandlers(context.nodes || [], context.options.userDatabaseEnabled, context.options.enableComments);

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
      if (isLoggingEnabled()) console.log(`??? УДАЛЕН узел из allReferencedNodeIds: ${nodeId} (не найден в текущих узлах)`);
    }
  });
  allReferencedNodeIds = filteredReferencedNodeIds;

  // Генерируем обработчики только если есть inline кнопки или условные кнопки
  generateInteractiveCallbackHandlers();

  // Генерируем обработчики для кнопок клавиатуры ответов
  code += generateReplyButtonHandlers(context.nodes);

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

  if (isLoggingEnabled()) {
    console.log(`🎯 ИТОГО найдено кнопок команд: ${commandButtons.size}`);
    console.log('📋 Список найденных кнопок команд:', Array.from(commandButtons));
  }

  code = addCommandCallbackHandlers(commandButtons, code, context.nodes || []);

  // Обработчики кнопок ответов уже добавлены выше, перед универсальным обработчиком текста
  if (context.options.enableGroupHandlers) {
    code += generateGroupBasedEventHandlers(context.groups, generateGroupHandlers);
  }

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  code += generateFallbackHandlers(context.options.userDatabaseEnabled);

  code += generateSignalHandler();
  code += generateBotInitialization(context.options.userDatabaseEnabled, menuCommands.length, hasInlineButtons(context.nodes || []));
  code += generatePollingLoop(context.options.userDatabaseEnabled);

  // Найдем узла с множественным выбором для использования в обработчиках
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(context.nodes as any[], isLoggingEnabled);

  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  code += generateMultiSelectCallbackHandler(
    multiSelectNodes as any[],
    context.nodes as any[] || [],
    context.allNodeIds,
    isLoggingEnabled(),
    generateTransitionLogicForMultiSelectCompletion,
    generateInlineKeyboardCode,
    formatTextForPython
  );

  const finalCode = generateCompleteBotScriptFromNodeGraphWithDependencies(
    code,
    {
      multiSelectNodes: multiSelectNodes as any[],
      allNodeIds: context.allNodeIds,
      isLoggingEnabled,
      nodes: context.nodes as any[],
      generateMultiSelectCallbackLogic: generateMultiSelectCallbackLogic as any,
      generateMultiSelectDoneHandler: generateMultiSelectDoneHandler as any,
      generateMultiSelectReplyHandler: generateMultiSelectReplyHandler as any
    }
  );

  // Валидация сгенерированного кода перед возвратом
  assertValidPython(finalCode);

  return finalCode;

  /**
   * Генерирует обработчики callback'ов для inline кнопок
   */
  function generateInteractiveCallbackHandlers(): void {
    const processNodeButtonsAndGenerateHandlers = createProcessNodeButtonsFunction(inlineNodes, nodes, code, allNodeIds, [], mediaVariablesMap);
    code = generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(inlineNodes, allReferencedNodeIds, allConditionalButtons, code, processNodeButtonsAndGenerateHandlers, nodes, allNodeIds, [], userDatabaseEnabled, mediaVariablesMap);
  }

  /**
   * Генерирует обработчики кнопочных ответов для сбора пользовательского ввода
   */
  function generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard() {
    const userInputNodes = (nodes || []).filter(node => node.type === 'message' &&
      node.data.responseType === 'buttons' &&
      Array.isArray(node.data.responseOptions) &&
      node.data.responseOptions.length > 0
    );

    if (userInputNodes.length > 0) {
      code += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
      code = generateButtonResponseHandlers(code, userInputNodes, nodes);
    }
  }

  /**
   * Генерирует универсальный обработчик пользовательского ввода
   * @returns {string} Python код обработчика
   */
  function generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation() {
    const adHocHandlerCode = generateAdHocInputCollectionHandler();
    const continuationHandlerCode = generateContinuationLogicForButtonBasedInput(
      nodes || [],
      formatTextForPython,
      generateUniversalVariableReplacement,
      generateInlineKeyboardCode,
      allNodeIds,
      generateNodeNavigation
    );
    code = newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(
      nodes,
      code,
      allNodeIds,
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
    code = newgenerateStateTransitionAndRenderLogic(nodes, code, allNodeIds, []);
  }
}

// Реэкспорт типов и функций для обратной совместимости
export type { Button } from './bot-generator/types';
export type { ResponseOption } from './bot-generator/types';
export { isLoggingEnabled } from './bot-generator/core';

// Повторный экспорт функций каркаса
export { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile };