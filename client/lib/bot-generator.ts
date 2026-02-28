// Внешние зависимости
import { BotData, BotGroup } from '@shared/schema';

// Типы
import { isLoggingEnabled, logFlowAnalysis } from './bot-generator/core';
import { setGlobalLoggingEnabled } from './bot-generator/core';
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
import { collectConditionalMessageButtons } from './Conditional/collectConditionalMessageButtons';
import { generateConditionalButtonHandlerCode, hasConditionalValueButtons } from './Conditional/conditional-button-handler';
import { generateGlobalCheckUserVariableFunction } from "./database/generateGlobalCheckUserVariableFunction";
import { generateUniversalVariableReplacement } from './database/generateUniversalVariableReplacement';
import { formatTextForPython } from './format';
import { extractNodesAndConnections } from './MediaHandler';
import { generateApiConfig, generateBasicBotSetupCode, generateDatabaseCode, generateGroupsConfiguration, generateNodeNavigation, generateSafeEditOrSendCode, generateUtf8EncodingCode, generateUtilityFunctions } from './generate';
import { generateCompleteBotScriptFromNodeGraphWithDependencies } from './generate-complete-bot-script';
import { generateNodeHandlers } from './generate/generate-node-handlers';
import { generateInlineKeyboardCode } from './Keyboard';
import { filterInlineNodes } from './Keyboard/filterInlineNodes';
import { generateReplyButtonHandlers } from './Keyboard/generate-reply-button-handlers';
import { generateTransitionLogicForMultiSelectCompletion } from './Keyboard/generate-transition-logic-multi-select';
import { generateButtonResponseHandlers } from './Keyboard/generateButtonResponseHandlers';
import { generateMultiSelectCallbackLogic } from './Keyboard/generateMultiSelectCallbackLogic';
import { generateMultiSelectDoneHandler } from './Keyboard/generateMultiSelectDoneHandler';
import { generateMultiSelectReplyHandler } from './Keyboard/generateMultiSelectReplyHandler';
import { hasInlineButtons } from './Keyboard/hasInlineButtons';
import { identifyNodesRequiringMultiSelectLogic } from './Keyboard/identifyNodesRequiringMultiSelectLogic';
import { processInlineButtonNodes } from './Keyboard/processInlineButtonNodes';
import { generateMessageLoggingCode } from './logging/generate-message-logging';
import { generateGroupHandlers } from './MediaHandler/generateGroupHandlers';
import { generateMediaFileFunctions } from './MediaHandler/generateMediaFileFunctions';
import { hasMediaNodes } from './MediaHandler/hasMediaNodes';
import { hasUploadImageUrls } from './MediaHandler/hasUploadImageUrls';
import { newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation } from './newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation';
import { newgenerateStateTransitionAndRenderLogic } from './bot-generator/transitions';
import { newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation } from './handle_user_input';
import { createProcessNodeButtonsFunction } from './newprocessNodeButtonsAndGenerateHandlers';
import { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile } from './scaffolding';
import { generateSynonymHandlers } from './Synonyms';
import { addAutoTransitionNodes } from './utils/addAutoTransitionNodes';
import { addInputTargetNodes } from './utils/addInputTargetNodes';
import { collectInputTargetNodes } from './utils/collectInputTargetNodes';
import { extractNodeData } from './utils/extractNodeData';
import { hasAutoTransitions } from './utils/hasAutoTransitions';
import { hasNodesRequiringSafeEditOrSend } from './utils/hasNodesRequiringSafeEditOrSend';
import { resetGenerationState } from './utils/generation-state';
import { setCommentsEnabled } from './utils/generateGeneratedComment';



/**
 * Генерирует Python-код для Telegram бота
 * @param {BotData} botData - Данные бота
 * @param {string} botName - Имя бота
 * @param {BotGroup[]} groups - Группы бота
 * @param {boolean} userDatabaseEnabled - Включена ли БД пользователей
 * @param {number | null} projectId - ID проекта
 * @param {boolean} enableLogging - Включить логирование
 * @param {boolean} enableGroupHandlers - Включить обработчики групп
 * @param {boolean} enableComments - Включить комментарии
 * @returns {string} Python код бота
 */
export function generatePythonCode(botData: BotData, botName: string = "MyBot", groups: BotGroup[] = [], userDatabaseEnabled: boolean = false, projectId: number | null = null, enableLogging: boolean = false, enableGroupHandlers: boolean = false, enableComments: boolean = true): string {
  // Сбрасываем состояние генерации перед началом
  resetGenerationState();

  // Устанавливаем флаг глобального логирования для этого запуска генерации
  setGlobalLoggingEnabled(enableLogging);
  
  // Устанавливаем флаг генерации комментариев для этого запуска генерации
  setCommentsEnabled(enableComments);

  const { nodes } = extractNodesAndConnections(botData);

  const { allNodeIds, mediaVariablesMap } = extractNodeData(nodes || []);

  // Анализируем и логируем поток
  logFlowAnalysis(nodes);

  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';

  const botFatherCommands = generateBotFatherCommands(nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }

  code += '"""\n\n';

  // Добавляем UTF-8 кодировку
  code += generateUtf8EncodingCode();

  // Генерируем Python импорты на основе типов узлов
  code += generatePythonImports({ nodes: nodes || [], userDatabaseEnabled });

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  const hasInlineButtonsResult = hasInlineButtons(nodes || []);
  const hasAutoTransitionsResult = hasAutoTransitions(nodes || []);
  const hasNodesRequiringSafeEditOrSendResult = hasNodesRequiringSafeEditOrSend(nodes || []);

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы ИЛИ другие узлы, требующие этой функции
  // ИЛИ если включена база данных пользователей (т.к. callback-обработчики могут использовать эту функцию)
  code += generateSafeEditOrSendCode(hasInlineButtonsResult || hasNodesRequiringSafeEditOrSendResult || userDatabaseEnabled, hasAutoTransitionsResult || userDatabaseEnabled);

  code += generateBasicBotSetupCode();

  // Добавляем конфигурацию API
  code += generateApiConfig();

  // Импортируем и добавляем код логирования сообщений, если включена БД
  code += generateMessageLoggingCode(userDatabaseEnabled, projectId, hasInlineButtons(nodes || []));

  // Добавляем конфигурацию групп
  code += generateGroupsConfiguration(groups);

  // user_data всегда нужен для временного хранения состояний даже при включенной БД
  // ИСПРАВЛЕНИЕ: Создаем user_data всегда, так как он используется в callback handlers
  code += '# Хранилище пользователей (временное состояние)\n';
  code += 'user_data = {}\n\n';

  // Добавляем функции для работы с базой данных
  code += generateDatabaseCode(userDatabaseEnabled, nodes || []);





  // Добавляем глобальные утилитарные функции
  code += generateGlobalCheckUserVariableFunction(); // Добавляем глобальное определение функции
  code += generateUtilityFunctions(userDatabaseEnabled);

  // Функции для работы с файлами - если есть медиа или узлы с изображениями из папки uploads
  // ИЛИ если включена база данных пользователей (для функции send_photo_with_logging)
  if (hasMediaNodes(nodes || []) || hasUploadImageUrls(nodes || []) || userDatabaseEnabled) {
    code += generateMediaFileFunctions();
  }

  // Определяем команды для меню BotFather
  const menuCommands = (nodes || []).filter(node =>
    (node.type === 'start' || node.type === 'command') &&
    node.data.showInMenu &&
    node.data.command
  );

  // Настройка меню команд для BotFather
  code += generateBotCommandsSetup(menuCommands);

  // Генерируем обработчики для каждого узла
  code += generateNodeHandlers(nodes || [], userDatabaseEnabled, enableComments);

  // Генерируем обработчики синонимов для всех узлов
  code += generateSynonymHandlers(nodes || []);

  // Генерируем обработчики обратного вызова для inline кнопок И целевых узлов ввода
  const inlineNodes = filterInlineNodes(nodes || []);

  // Также собираем все целевые узла из коллекций пользовательского ввода
  const inputTargetNodeIds = collectInputTargetNodes(nodes || []);

  // Собираем все идентификаторы ссылочных узлов и кнопки условных сообщений
  let allReferencedNodeIds = new Set<string>();
  const allConditionalButtons = new Set<string>();

  // Добавляем узла из inline кнопок
  processInlineButtonNodes(inlineNodes, allReferencedNodeIds);

  // Собираем кнопки из условных сообщений
  collectConditionalMessageButtons(nodes || [], allConditionalButtons);

  // Добавляем целевые узла ввода
  addInputTargetNodes(inputTargetNodeIds, allReferencedNodeIds);

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем узла, которые являются целями автопереходов
  addAutoTransitionNodes(nodes || [], allReferencedNodeIds);

  // Добавляем все узлы в allReferencedNodeIds, чтобы для каждого узла создавался обработчик
  // Это необходимо, потому что в разных местах кода генерируются вызовы handle_callback_... для всех узлов
  (nodes || []).forEach(node => {
    allReferencedNodeIds.add(node.id);
  });

  // ФИЛЬТРАЦИЯ: Убедимся, что allReferencedNodeIds содержит только реально существующие узлы
  // Это предотвращает генерацию обработчиков для удаленных или несуществующих узлов
  const existingNodeIds = new Set((nodes || []).map(node => node.id));
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
  generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation();

  // Генерируем обработчики для кнопок клавиатуры ответов
  code += generateReplyButtonHandlers(nodes);

  // Добавляем обработчики кнопочных ответов для узлов сбора ввода
  generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard();

  // ПРИМЕЧАНИЕ: Дублирующий набор обработчиков reply-кнопок был удален
  // Теперь логика сохранения данных через waiting_for_input добавлена в первый набор обработчиков выше
  // Это исправляет проблему когда reply-кнопки не сохраняли данные пользователя

  // Добавляем универсальный обработчик пользовательского ввода только если есть сбор данных
  generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation();

  // Добавляем обработчик для условных кнопок (conditional_variableName_value) ТОЛЬКО если есть условные кнопки
  if (hasConditionalValueButtons(nodes)) {
    code += generateConditionalButtonHandlerCode();
  }

  // Добавляем обработчики для кнопок команд (типа cmd_start) с подробным логированием
  const commandButtons = collectAllCommandCallbacksFromNodes(nodes || []);

  if (isLoggingEnabled()) {
    console.log(`🎯 ИТОГО найдено кнопок команд: ${commandButtons.size}`);
    console.log('📋 Список найденных кнопок команд:', Array.from(commandButtons));
  }

  code = addCommandCallbackHandlers(commandButtons, code, nodes || []);

  // Обработчики кнопок ответов уже добавлены выше, перед универсальным обработчиком текста
  if (enableGroupHandlers) {
    code += generateGroupBasedEventHandlers(groups, generateGroupHandlers);
  }

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  code += generateFallbackHandlers(userDatabaseEnabled);

  code += generateSignalHandler();
  code += generateBotInitialization(userDatabaseEnabled, menuCommands.length, hasInlineButtons(nodes || []));
  code += generatePollingLoop(userDatabaseEnabled);

  // Найдем узла с множественным выбором для использования в обработчиках
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(nodes, isLoggingEnabled);

  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  code += generateMultiSelectCallbackHandler(
    multiSelectNodes,
    nodes || [],
    allNodeIds,
    isLoggingEnabled(),
    generateTransitionLogicForMultiSelectCompletion,
    generateInlineKeyboardCode,
    formatTextForPython
  );

  return generateCompleteBotScriptFromNodeGraphWithDependencies(
    code,
    multiSelectNodes,
    allNodeIds,
    isLoggingEnabled,
    nodes,
    generateMultiSelectCallbackLogic,
    generateMultiSelectDoneHandler,
    generateMultiSelectReplyHandler
  );

  /**
   * Генерирует обработчики callback'ов для inline кнопок
   */
  function generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(): void {
    const processNodeButtonsAndGenerateHandlers = createProcessNodeButtonsFunction(inlineNodes, nodes, code, allNodeIds, [], mediaVariablesMap);
    code = newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(inlineNodes, allReferencedNodeIds, allConditionalButtons, code, processNodeButtonsAndGenerateHandlers, nodes, allNodeIds, [], userDatabaseEnabled, mediaVariablesMap);
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