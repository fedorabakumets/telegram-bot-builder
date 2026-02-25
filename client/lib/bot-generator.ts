// Внешние зависимости
import { BotData, BotGroup, buttonSchema, Node } from '@shared/schema';
import { z } from 'zod';

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
import { newgenerateStateTransitionAndRenderLogic } from './newgenerateStateTransitionAndRenderLogic';
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


export type Button = z.infer<typeof buttonSchema>;

/**
 * Интерфейс для опций ответа (responseOptions)
 */
export interface ResponseOption {
  /** Текст опции ответа */
  text: string;
  /** Значение, связанное с опцией (необязательно) */
  value?: string;
  /** Действие, выполняемое при выборе опции (необязательно) */
  action?: string;
  /** Целевой узел или команда для перехода (необязательно) */
  target?: string;
  /** URL для внешней ссылки (необязательно) */
  url?: string;
}

/*
============================================================================
СТРУКТУРА ФАЙЛА - НАВИГАЦИЯ ПО ГРУППАМ ФУНКЦИЙ
============================================================================

1. УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
   - extractNodesAndConnections()

2. УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ И ОБРАБОТКИ ТЕКСТА
   - createSafeFunctionName(), escapeForPython(), stripHtmlTags()
   - formatTextForPython(), getParseMode()

3. ФУНКЦИИ АНАЛИЗА ВОЗМОЖНОСТЕЙ БОТА
   - hasMultiSelectNodes(), hasAutoTransitions()
   - hasInlineButtons(), hasInputCollection(), hasMediaNodes()
   - hasConditionalButtons(), hasCommandButtons()

4. УТИЛИТЫ ДЛЯ РАБОТЫ С ПЕРЕМЕННЫМИ И МЕДИА
   - collectMediaVariables(), findMediaVariablesInText()
   - toPythonBoolean()

5. ГЕНЕРАТОРЫ СОСТОЯНИЙ И ИДЕНТИФИКАТОРОВ
   - generateWaitingStateCode(), generateUniqueShortId()
   - escapeForJsonString()

6. ГЕНЕРАТОРЫ КЛАВИАТУР И КНОПОК
   - calculateOptimalColumns(), generateReplyKeyboardCode()
   - generateInlineKeyboardCode(), generateButtonText()

7. ГЕНЕРАТОРЫ ЗАМЕНЫ ПЕРЕМЕННЫХ
   - generateVariableReplacement(), generateUniversalVariableReplacement()

8. ГЕНЕРАТОРЫ МЕДИА И УСЛОВНЫХ СООБЩЕНИЙ
   - generateAttachedMediaSendCode(), generateConditionalKeyboard()
   - generateConditionalMessageLogic()

9. ПАРСЕРЫ И ОСНОВНЫЕ ГЕНЕРАТОРЫ
   - parsePythonCodeToJson(), generatePythonCode()

10. ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ КОМАНД И СООБЩЕНИЙ
    - generateStartHandler(), generateCommandHandler()

11. ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ МЕДИА
    - generateStickerHandler(), generateVoiceHandler()
    - generateAnimationHandler(), generateLocationHandler()
    - generateContactHandler()

12. ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ УПРАВЛЕНИЯ КОНТЕНТОМ
    - generatePinMessageHandler(), generateUnpinMessageHandler()
    - generateDeleteMessageHandler()

13. ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ
    - generateBanUserHandler(), generateUnbanUserHandler()
    - generateMuteUserHandler(), generateUnmuteUserHandler()
    - generateKickUserHandler(), generatePromoteUserHandler()
    - generateDemoteUserHandler(), generateAdminRightsHandler()

14. ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ СИНОНИМОВ
    - generateSynonymHandler(), generateMessageSynonymHandler()

15. ГЕНЕРАТОРЫ ДОПОЛНИТЕЛЬНЫХ ФАЙЛОВ ПРОЕКТА
    - generateRequirementsTxt(), generateReadme()
    - generateDockerfile(), generateConfigYaml()

16. ТИПЫ И ИНТЕРФЕЙСЫ
    - CodeNodeRange, CodeWithMap
============================================================================
*/

// Глобальная переменная для состояния логирования (может быть переопределена параметром)
export let globalLoggingEnabled = false;

/**
 * Утилитарная функция для проверки включения логирования отладки
 * @returns {boolean} Статус включения логирования
 */
export const isLoggingEnabled = (): boolean => {
  // Сначала проверяем, было ли явно установлено глобальное логирование (из параметра enableLogging)
  if (globalLoggingEnabled) return true;

  // В противном случае проверяем localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

/**
 * Анализирует и логирует структуру узлов для отладки.
 * @param {any[]} nodes - Массив узлов.
 */
const logFlowAnalysis = (nodes: any[]) => {
  if (!isLoggingEnabled()) return;

  console.log(`🔍 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}`);

  if (nodes && nodes.length > 0) {
    console.log('?? ГЕНЕРАТОР: Анализируем все узла:');
    nodes.forEach((node, index) => {
      console.log(`?? ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
      console.log(`?? ГЕНЕРАТОР:   - allowMultipleSelection: ${node.data.allowMultipleSelection}`);
      console.log(`?? ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
      console.log(`?? ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
      console.log(`?? ГЕНЕРАТОР:   - continueButtonTarget: ${node.data.continueButtonTarget || 'нет'}`);

      if (node.id === 'interests_result') {
        console.log(`?? ГЕНЕРАТОР: НАЙДЕН interests_result!`);
        console.log(`?? ГЕНЕРАТОР: interests_result полные данные:`, JSON.stringify(node.data, null, 2));
      }
    });
  }
};

/**
 * Генерирует Python-код для Telegram бота на основе предоставленных данных
 * @param {BotData} botData - Данные бота для генерации
 * @param {string} botName - Имя бота (по умолчанию "MyBot")
 * @param {BotGroup[]} groups - Массив групп бота (по умолчанию пустой)
 * @param {boolean} userDatabaseEnabled - Флаг включения пользовательской базы данных (по умолчанию false)
 * @param {number | null} projectId - ID проекта (по умолчанию null)
 * @param {boolean} enableLogging - Флаг включения логирования (по умолчанию false)
 * @param {boolean} enableGroupHandlers - Флаг включения обработчиков для работы с группами (по умолчанию false)
 * @returns {string} Сгенерированный Python-код для бота
 */
export function generatePythonCode(botData: BotData, botName: string = "MyBot", groups: BotGroup[] = [], userDatabaseEnabled: boolean = false, projectId: number | null = null, enableLogging: boolean = false, enableGroupHandlers: boolean = false, enableComments: boolean = true): string {
  // Сбрасываем состояние генерации перед началом
  resetGenerationState();

  // Устанавливаем флаг глобального логирования для этого запуска генерации
  globalLoggingEnabled = enableLogging;
  
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

  // Добавляем UTF-8 кодировку и базовые импорты в начало файла
  code += generateUtf8EncodingCode();

  // Определяем, нужны ли специфичные импорты
  const hasCommandNodes = (nodes || []).some(node => node.type === 'command' ||
    (node.data.buttons && node.data.buttons.some((btn: Button) => btn.action === 'command')));
  const hasStartNodes = (nodes || []).some(node => node.type === 'start');
  const hasMediaNodesResult = hasMediaNodes(nodes || []);
  const hasStickerNodes = (nodes || []).some(node => node.type === 'sticker');
  const hasVoiceNodes = (nodes || []).some(node => node.type === 'voice');
  const hasLocationNodes = (nodes || []).some(node => node.type === 'location');
  const hasContactNodes = (nodes || []).some(node => node.type === 'contact');

  if (hasCommandNodes || hasStartNodes) {
    // Если есть команды или стартовые узлы, добавляем соответствующие импорты
    if (hasStartNodes) {
      code += 'from aiogram.filters import CommandStart\n';
    }
    if (hasCommandNodes) {
      code += 'from aiogram.filters import Command\n';
    }
  }


  // Проверяем, есть ли узлы с URL-изображениями, которые требуют URLInputFile
  const hasUrlImageNodes = (nodes || []).some(node =>
    node.data?.imageUrl && node.data.imageUrl.startsWith('http')
  );

  if (hasUrlImageNodes) {
    code += 'from aiogram.types import URLInputFile\n';
  }

  // Проверяем, есть ли узлы, которые требуют импорт datetime
  const hasNodesRequiringDatetime = (nodes || []).some(node =>
    node.type === 'command' ||  // Команды могут использовать datetime для логирования времени вызова
    node.type === 'mute_user' || // mute_user использует datetime для вычисления времени окончания
    node.type === 'ban_user' || // ban_user может использовать datetime для временных банов
    node.type === 'message' || // Сообщения могут использовать datetime для временных меток
    node.type === 'sticker' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'voice' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'animation' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'photo' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'video' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'document' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'audio' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'location' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'contact' || // Медиа-контент может использовать datetime для временных меток
    node.type === 'group_event' // Обработчики событий в группах могут использовать datetime для логирования
  );

  // Также проверяем, есть ли узлы, требующие timezone (например, для временных меток с UTC)
  const hasNodesRequiringTimezone = (nodes || []).some(node =>
    node.type === 'photo' || // Обработчик фото использует datetime.now(timezone.utc)
    node.type === 'group_event' || // Обработчики групп могут использовать timezone для временных меток
    (node.data && node.data.enablePhotoInput) // Узлы с включенным вводом фото также используют datetime.now(timezone.utc)
  );

  if (hasNodesRequiringDatetime || userDatabaseEnabled) {
    if (hasNodesRequiringTimezone) {
      code += 'from datetime import datetime, timezone\n'; // Добавляем timezone, если он нужен
    } else {
      code += 'from datetime import datetime\n';
    }
  }

  // Проверяем, есть ли узлы, которые требуют импорт ParseMode
  // ParseMode нужен для: форматирования текста (html/markdown), отправки медиа с caption, клавиатур с форматированием
  const hasNodesRequiringParseMode = (nodes || []).some(node =>
    // Узлы с явным formatMode (html/markdown)
    (node.data?.formatMode &&
      (node.data.formatMode.toLowerCase() === 'html' ||
        node.data.formatMode.toLowerCase() === 'markdown')) ||
    // Узлы с markdown флагом (старый формат)
    node.data?.markdown === true ||
    // Узлы с кнопками и форматированием
    (node.data?.buttons && node.data.buttons.length > 0 &&
      (node.data.formatMode === 'html' || node.data.formatMode === 'markdown' || node.data.markdown === true)) ||
    // Узлы с медиа и caption (требуют parse_mode для форматирования подписи)
    (node.data?.imageUrl && node.data.mediaCaption) ||
    (node.data?.videoUrl && node.data.mediaCaption) ||
    (node.data?.audioUrl && node.data.mediaCaption) ||
    (node.data?.documentUrl && node.data.mediaCaption) ||
    // Узлы с включенным сбором ввода и форматированием
    (node.data?.collectUserInput === true &&
      (node.data.formatMode === 'html' || node.data.formatMode === 'markdown' || node.data.markdown === true)) ||
    // Узлы с conditional messages и форматированием
    (node.data?.enableConditionalMessages === true &&
      (node.data.formatMode === 'html' || node.data.formatMode === 'markdown' || node.data.markdown === true))
  );

  if (hasNodesRequiringParseMode) {
    code += 'from aiogram.enums import ParseMode\n';
  }

  // Модуль re требуется для функции replace_variables_in_text
  code += 'import re\n';

  // TelegramBadRequest используется в обработчиках исключений при работе с медиа и другими действиями
  // Проверяем, есть ли узлы, которые используют TelegramBadRequest в обработчиках исключений
  const hasNodesRequiringTelegramBadRequest = (nodes || []).some(node =>
    node.type === 'delete_message' ||
    node.type === 'pin_message' ||
    node.type === 'unpin_message' ||
    node.type === 'ban_user' ||
    node.type === 'unban_user' ||
    node.type === 'mute_user' ||
    node.type === 'unmute_user' ||
    node.type === 'kick_user' ||
    node.type === 'promote_user' ||
    node.type === 'demote_user' ||
    node.type === 'admin_rights' ||
    node.type === 'sticker' ||
    node.type === 'voice' ||
    node.type === 'animation' ||
    node.type === 'location' ||
    node.type === 'contact' ||
    hasMediaNodesResult ||
    hasStickerNodes ||
    hasVoiceNodes ||
    hasLocationNodes ||
    hasContactNodes
  );

  if (hasNodesRequiringTelegramBadRequest) {
    code += 'from aiogram.exceptions import TelegramBadRequest\n';
  }

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

  /**
   * Генерирует код настройки меню команд для BotFather
   * @param menuCommands - Команды, которые будут отображаться в меню
   * @returns Сгенерированный код настройки меню команд
   */

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

  // Добавляем обработчики для кнопок команд (типа cmd_start) с подробным логирояяяяяяяанием
  const commandButtons = collectAllCommandCallbacksFromNodes();

  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`?? ИТОГО найдено кнопок команд: ${commandButtons.size}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log('?? Список найденных кнопок команд:', Array.from(commandButtons));

  addCommandCallbackHandlers();

  // Обработчики кнопок ответов уже добавлены выше, перед универсальным обработчиком тттекста
  if (enableGroupHandlers) {
    generateGroupBasedEventHandlers();
  }

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  generateFallbackHandlers();

  signal_handler();
  generateBotInitializationAndMiddlewareSetup();
  generateMainPollingLoopWithGracefulShutdown();

  // Найдем узла с множественным выбором для использования в обработчиках
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(nodes, isLoggingEnabled);

  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  handle_multi_select_callback();

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
   * Генерирует обработчики callback'ов для inline кнопок с поддержкой условных сообщений,
   * множественного выбора и автопереходов
   * 
   * Функция создает Python код для обработки callback_query от inline кнопок в Telegram боте
   * с поддержкой следующих возможностей:
   * 
   * - **Условные сообщения**: Динамическое отображение сообщений на основе данных пользователя
   * - **Множественный выбор**: Поддержка кнопок с возможностью выбора нескольких вариантов
   * - **Автоматические переходы**: Автоматическая навигация между узлами без действий пользователя
   * - **Специальная обработка узлов**: Особая логика для узлов типа interests_result с метро-клавиатурой
   * - **Различные типы клавиатур**: Поддержка inline и reply клавиатур
   * - **Медиа-контент**: Отправка изображений, видео и других файлов
   * - **Валидация ввода**: Проверка и сохранение пользовательских данных
   * - **Управление состоянием**: Отслеживание состояния ожидания ввода от пользователя
   * 
   * Алгоритм работы:
   * 1. Проверяет наличие inline кнопок или условных кнопок
   * 2. Обрабатывает специальные узлы (interests_result)
   * 3. Генерирует обработчики для всех ссылочных узлов
   * 4. Создает логику навигации и сохранения данных
   * 5. Добавляет поддержку автопереходов
   * 
   * @remarks
   * - Избегает дублирования обработчиков для узлов типа 'start', 'interests_result', 'metro_selection'
   * - Поддерживает условные клавиатуры для динамического отображения кнопок
   * - Обрабатывает специальные случаи для множественного выбора
   * - Интегрируется с системой логирования для отладки
   */
  function generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(): void {
    const processNodeButtonsAndGenerateHandlers = createProcessNodeButtonsFunction(inlineNodes, nodes, code, allNodeIds, [], mediaVariablesMap);
    code = newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(inlineNodes, allReferencedNodeIds, allConditionalButtons, code, processNodeButtonsAndGenerateHandlers, nodes, allNodeIds, [], userDatabaseEnabled, mediaVariablesMap);
  }

  /**
   * Генерирует обработчики кнопочных ответов для сбора пользовательского ввода с reply-клавиатурой.
   * 
   * Функция анализирует узлы типа 'message' с типом ответа 'buttons' и опциями ответа,
   * затем генерирует соответствующие обработчики для Telegram бота на Python.
   * Генерируемые обработчики позволяют пользователю выбирать варианты ответов
   * через reply-кнопки вместо ввода текста.
   * 
   * @remarks
   * Функция работает с глобальными переменными:
   * - `nodes`: массив узлов для анализа
   * - `code`: строка для накопления генерируемого кода
   * 
   * @example
   * ```typescript
   * // Пример использования
   * generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard();
   * // Генерирует код обработчиков для узлов с кнопочными ответами
   * ```
   * 
   * @see {@link generateButtonResponseHandlers} - основная функция генерации обработчиков
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
   * Генерирует универсальный обработчик пользовательского ввода с поддержкой условных сообщений,
   * кнопок пропуска сбора данных, валидации и навигации.
   * 
   * Эта функция создает комплексный обработчик для Telegram бота, который:
   * - Обрабатывает текстовые сообщения пользователей
   * - Поддерживает условные сообщения на основе данных пользователя
   * - Обрабатывает кнопки с флагом skipDataCollection для пропуска сбора данных
   * - Выполняет валидацию введенных данных (email, телефон, число)
   * - Управляет навигацией между узлами диалога
   * - Поддерживает множественные форматы ввода (текст, медиа, кнопки)
   * - Интегрируется с базой данных для сохранения пользовательских данных
   * 
   * @returns {string} Сгенерированный Python код обработчика пользовательского ввода
   * 
   * @example
   * // Пример использования
   * const nodes = [
   *   {
   *     id: 'start_node',
   *     type: 'message',
   *     data: {
   *       messageText: 'Добро пожаловать!',
   *       collectUserInput: true,
   *       inputVariable: 'user_name'
   *     }
   *   }
   * ];
   * const generatedCode = generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation();
   * 
   * @since 1.0.0
   * @author Bot Generator Team
   */
  function generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation() {
    code = newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes, code, allNodeIds, [], generateAdHocInputCollectionHandler, generateContinuationLogicForButtonBasedInput, generateUserInputValidationAndContinuationLogic, generateStateTransitionAndRenderLogic);
  }

  /**
   * Генерирует Python код для обработки ad-hoc сбора пользовательского ввода в Telegram боте.
   * 
   * Эта функция создает обработчик для ситуаций, когда боту необходимо собрать дополнительную
   * информацию от пользователя в процессе диалога. Функция поддерживает два основных сценария:
   * 
   * 1. **Основной ввод с переходом**: Когда пользователь вводит данные, которые должны быть
   *    сохранены и использованны для перехода к следующему узлу бота
   * 2. **Дополнительный комментарий**: Когда пользователь может оставить дополнительный
   *    комментарий без перехода к следующему узлу
   * 
   * Основные возможности:
   * - Проверка существования узла для сбора ввода
   * - Поддержка дополнительного сбора ответов для обычных кнопок
   * - Сохранение пользовательских данных в локальное хранилище и базу данных
   * - Автоматическая очистка состояния сбора ввода после обработки
   * - Логирование всех операций для отладки
   * - Навигация к целевому узлу после успешного ввода
   * 
   * Генерируемый Python код включает:
   * - Валидацию наличия узла в графе бота
   * - Проверку флага input_collection_enabled для дополнительного сбора
   * - Сохранение данных с временными метками
   * - Обработку ошибок сохранения в базу данных
   * - Навигационную логику для перехода к следующему узлу
   * 
   * @example
   * // Генерирует код для обработки пользовательского ввода
   * // когда бот ожидает ответ от пользователя после нажатия кнопки
   * 
   * @see generateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation
   * @see generateButtonResponseHandlersForUserInputCollectionWithReplyKeyboard
   * 
   * @returns {void} Функция добавляет сгенерированный Python код к глобальной переменной `code`
   */
  function generateAdHocInputCollectionHandler() {
    code += '        \n';
    code += '        # Если узел не найден\n';
    code += '        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")\n';
    code += '        del user_data[user_id]["waiting_for_input"]\n';
    code += '        return\n';
    code += '    \n';
    code += '    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок\n';
    code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
    code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
    code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
    code += '        input_target_node_id = user_data[user_id].get("input_target_node_id")\n';
    code += '        user_text = message.text\n';
    code += '        \n';
    code += '        # Если есть целевой узел для перехода - это основной ввод, а не дополнительный\n';
    code += '        if input_target_node_id:\n';
    code += '            # Это основной ввод с переходом к следующему узлу\n';
    code += '            timestamp = get_moscow_time()\n';
    code += '            response_data = user_text\n';
    code += '            \n';
    code += '            # Сохраняем в пользовательские данные\n';
    code += '            user_data[user_id][input_variable] = response_data\n';
    code += '            \n';
    code += '            # Сохраняем в базу данных\n';
    code += '            saved_to_db = await update_user_data_in_db(user_id, input_variable, response_data)\n';
    code += '            if saved_to_db:\n';
    code += '                logging.info(f"? Данные сохранены в БД: {input_variable} = {user_text} (пользователь {user_id})")\n';
    code += '            else:\n';
    code += '                logging.warning(f"?? Не удалось сохранить в БД, данные сохранены локально")\n';
    code += '            \n';
    code += '            logging.info(f"Получен основной пользовательский ввод: {input_variable} = {user_text}")\n';
    code += '            \n';
    code += '            # Переходим к целевому узлу\n';
    code += '            # Очищаем состояние сбора ввода\n';
    code += '            del user_data[user_id]["input_collection_enabled"]\n';
    code += '            if "input_node_id" in user_data[user_id]:\n';
    code += '                del user_data[user_id]["input_node_id"]\n';
    code += '            if "input_variable" in user_data[user_id]:\n';
    code += '                del user_data[user_id]["input_variable"]\n';
    code += '            if "input_target_node_id" in user_data[user_id]:\n';
    code += '                del user_data[user_id]["input_target_node_id"]\n';
    code += '            \n';
    code += '            # Находим и вызываем обработчик целевого узла\n';
  }

  /**
   * Генерирует Python-код для логики продолжения обработки пользовательского ввода через кнопки
   * 
   * Эта функция создает Python-код, который обрабатывает различные сценарии продолжения
   * после получения пользовательского ввода через кнопки в Telegram боте. Функция генерирует
   * обработчики для разных типов узлов и их поведения.
   * 
   * Основные функции генерируемого кода:
   * - Обработка переходов к целевым узлам на основе ID ввода
   * - Поддержка узлов типа 'message' с отправкой текста и клавиатур
   * - Обработка множественного выбора (allowMultipleSelection)
   * - Генерация inline и reply клавиатур
   * - Замена переменных в сообщениях
   * - Сохранение пользовательских данных
   * - Логирование операций
   * - Обработка дополнительных комментариев
   * 
   * Алгоритм работы:
   * 1. Перебирает все целевые узлы для обработки
   * 2. Для каждого узла генерирует условную логику проверки соответствия input_target_node_id
   * 3. Обрабатывает узлы типа 'message' - отправляет текст с возможными клавиатурами
   * 4. Обрабатывает узлы с множественным выбором - инициализирует состояние выбора
   * 5. Обрабатывает обычные узлы - отправляет простые сообщения
   * 6. Генерирует fallback обработку для дополнительных комментариев
   * 7. Возвращает код навигации между узлами
   * 
   * @returns {string} Сгенерированный Python-код для логики продолжения ввода через кнопки
   * 
   * @example
   * // Генерирует код типа:
   * // if input_target_node_id == "node123":
   * //     text = "Сообщение"
   * //     await message.answer(text, reply_markup=keyboard)
   * //     logging.info("Переход к узлу node123 выполнен")
   * 
   * @remarks
   * - Использует глобальные переменные: nodes, code, allNodeIds
   * - Вызывает вспомогательные функции: formatTextForPython, generateUniversalVariableReplacement,
   *   generateInlineKeyboardCode, generateNodeNavigation
   * - Поддерживает различные типы клавиатур (inline/reply)
   * - Включает обработку ошибок и логирование
   * - Управляет состоянием пользовательских данных в user_data
   */
  function generateContinuationLogicForButtonBasedInput() {
    nodes.forEach((targetNode) => {
      code += `            if input_target_node_id == "${targetNode.id}":\n`;
      if (targetNode.type === 'message') {
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                # Переход к узлу ${targetNode.id}\n`;
        code += `                text = ${formattedText}\n`;

        // Замена переменных
        code += '                user_data[user_id] = user_data.get(user_id, {})\n';
        const universalVarCodeLines: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines, '                ');
        code += universalVarCodeLines.join('\n');

        // Отправляем сообщение с кнопками если есть
        if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += `                await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                await message.answer(text)\n`;
        }
        code += `                logging.info(f"Переход к узлу ${targetNode.id} выполнен")\n`;
      } else if (targetNode.data.allowMultipleSelection) {
        // Для узлов с множественным выбором создаем прямую навигацию
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
        code += `                text = ${formattedText}\n`;

        // Замена переменных
        code += '                user_data[user_id] = user_data.get(user_id, {})\n';
        const universalVarCodeLines: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines, '                ');
        code += universalVarCodeLines.join('\n');

        // Инициализируем состояние множественного выбора
        code += `                # Инициализируем состояние множественного выбора\n`;
        code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
        code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
        code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
        if (targetNode.data.multiSelectVariable) {
          code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
        }

        // Создаем inline клавиятуря с кнопками выбора
        if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += `                await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                await message.answer(text)\n`;
        }
        code += `                logging.info(f"? Прямая навигация к узлу множественного выбяра ${targetNode.id} выполнена")\n`;
      } else {
        // Для обычных узлов отправляем простое сообщение
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                # Обычный узел - отправляем сообщение ${targetNode.id}\n`;
        code += `                text = ${formattedText}\n`;

        // Замена переменных
        code += '                user_data[user_id] = user_data.get(user_id, {})\n';
        const universalVarCodeLines: string[] = [];
        generateUniversalVariableReplacement(universalVarCodeLines, '                ');
        code += universalVarCodeLines.join('\n');

        if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += `                await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                await message.answer(text)\n`;
        }
        code += `                logging.info(f"? Навигация к обычному узлу ${targetNode.id} выполнена")\n`;
      }
    });
    code += '            return\n';
    code += '        else:\n';
    code += '            # Это дополнительный комментарий (нет целевого узла)\n';
    code += '            timestamp = get_moscow_time()\n';
    code += '            response_data = user_text\n';
    code += '            \n';
    code += '            # Сохраняем в пользовательские данные\n';
    code += '            user_data[user_id][f"{input_variable}_additional"] = response_data\n';
    code += '            \n';
    code += '            # Уведомляем пользователя\n';
    code += '            await message.answer("? Дополнительный комментарий сохранен!")\n';
    code += '            \n';
    code += '            logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Если нет активного ожидания ввода, игнорируем сообщение\n';
    code += '    return\n';

    const navigationCode = generateNodeNavigation(nodes || [], '            ', 'next_node_id', 'message', 'user_vars');
    return navigationCode;
  }

  /**
   * Генерирует код валидации пользовательского ввода и логики продолжения диалога
   * 
   * Эта функция создает Python-код для валидации и обработки пользовательского ввода в Telegram боте.
   * Она является ключевым компонентом системы сбора данных от пользователей и обеспечивает:
   * 
   * **Функциональность валидации:**
   * - Валидация длины текста (минимум и максимум символов)
   * - Валидация типа ввода (email, номер телефона, числовые значения)
   * - Регулярные выражения для проверки форматов email и телефонных номеров
   * - Обработка ошибок валидации с возможностью повторного ввода
   * 
   * **Функциональность сохранения данных:**
   * - Сохранение в локальное хранилище user_data
   * - Сохранение в базу данных (если включено)
   * - Поддержка различных типов данных (текст, числа, email, телефон)
   * - Логирование всех операций сохранения
   * 
   * **Функциональность навигации:**
   * - Автоматический переход к следующему узлу после успешного ввода
   * - Создание фейкового сообщения для навигации
   * - Поддержка различных типов целевых узлов
   * - Обработка ошибок навигации
   * 
   * **Генерируемый код включает:**
   * - Проверку длины текста с настраиваемыми лимитами
   * - Регулярные выражения для email и телефонов
   * - Конструкции try-catch для валидации чисел
   * - Сохранение в user_data и базу данных
   * - Логирование всех операций
   * - Автоматическую навигацию к следующему узлу
   * - Очистку состояния ожидания ввода
   * 
   * @remarks
   * Функция генерирует код, который интегрируется с системой состояний бота
   * и обеспечивает надежную валидацию пользовательского ввода
   * 
   * @example
   * // Сгенерированный код будет содержать:
   * // - Валидацию email с регулярным выражением
   * // - Проверку длины текста
   * // - Сохранение в БД с логированием
   * // - Автоматический переход к следующему узлу
   */
  function generateUserInputValidationAndContinuationLogic() {
    code += '    # Валидация длины тттекста\n';
    code += '    min_length = input_config.get("min_length", 0)\n';
    code += '    max_length = input_config.get("max_length", 0)\n';
    code += '    \n';
    code += '    if min_length > 0 and len(user_text) < min_length:\n';
    code += '        retry_message = input_config.get("retry_message", "Пожалуйста, яопробуйте еще раз.")\n';
    code += '        await message.answer(f"? Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
    code += '        return\n';
    code += '    \n';
    code += '    if max_length > 0 and len(user_text) > max_length:\n';
    code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте ещя раз.")\n';
    code += '        await message.answer(f"? Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Валидация типа ввода\n';
    code += '    input_type = input_config.get("type", "text")\n';
    code += '    \n';
    code += '    if input_type == "email":\n';
    code += '        import re\n';
    code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
    code += '        if not re.match(email_pattern, user_text):\n';
    code += '            retry_message = input_config.get("retry_message", "Пожалуйсяа, яопрояуйте еще ряз.")\n';
    code += '            await message.answer(f"? Неверный фярмат email. {retry_message}")\n';
    code += '            return\n';
    code += '    \n';
    code += '    elif input_type == "number":\n';
    code += '        try:\n';
    code += '            float(user_text)\n';
    code += '        except ValueError:\n';
    code += '            retry_message = input_config.get("retry_message", "Пожалуйста, пояробуйтя еще раз.")\n';
    code += '            await message.answer(f"? Введите корректное чясло. {retry_message}")\n';
    code += '            return\n';
    code += '    \n';
    code += '    elif input_type == "phone":\n';
    code += '        import re\n';
    code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
    code += '        if not re.match(phone_pattern, user_text):\n';
    code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще ряз.")\n';
    code += '            await message.answer(f"? Неверный формат телефона. {retry_message}")\n';
    code += '            return\n';
    code += '    \n';
    code += '    # Сохраняея ответ пользователя простым значением\n';
    code += '    variable_name = input_config.get("variable", "user_response")\n';
    code += '    timestamp = get_moscow_time()\n';
    code += '    node_id = input_config.get("node_id", "unknown")\n';
    code += '    \n';
    code += '    # Простое значение вместо сложного объекта\n';
    code += '    response_data = user_text\n';
    code += '    \n';
    code += '    # Сохраняем в пользовательские данные\n';
    code += '    user_data[user_id][variable_name] = response_data\n';
    code += '    \n';
    code += '    # Сохраняем в базу данных если включено\n';
    code += '    if input_config.get("save_to_database"):\n';
    code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
    code += '        if saved_to_db:\n';
    code += '            logging.info(f"? Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
    code += '        else:\n';
    code += '            logging.warning(f"?? Не удалось сохранить в яД, данные сохранены ляякально")\n';
    code += '    \n';
    code += '    # Отправляем сообщение об успехе только если оно задано\n';
    code += '    success_message = input_config.get("success_message", "")\n';
    code += '    if success_message:\n';
    code += '        await message.answer(success_message)\n';
    code += '    \n';
    code += '    # Очищаем состояние ожидания ввода\n';
    code += '    del user_data[user_id]["waiting_for_input"]\n';
    code += '    \n';
    code += '    logging.info(f"Получея пользовательский ввод: {variable_name} = {user_text}")\n';
    code += '    \n';
    code += '    # Автоматическая навигация к следующему узлу после успешного ввода\n';
    code += '    next_node_id = input_config.get("next_node_id")\n';
    code += '    logging.info(f"?? Проверяям навияяяяацию: next_node_id = {next_node_id}")\n';
    code += '    if next_node_id:\n';
    code += '        try:\n';
    code += '            logging.info(f"?? Переходим к следующему узлу: {next_node_id}")\n';
    code += '            \n';
    code += '            # Создаем фейковое сообщение для навигации\n';
    code += '            fake_message = type("FakeMessage", (), {})()\n';
    code += '            fake_message.from_user = message.from_user\n';
    code += '            fake_message.answer = message.answer\n';
    code += '            fake_message.delete = lambda: None\n';
    code += '            \n';
    code += '            # Находим узел по ID и выполняем соответствующее действие\n';
  }

  /**
   * Генерирует код логики переходов состояний и рендеринга сообщений
   * 
   * Эта функция создает Python-код для обработки навигации между узлами бота и рендеринга
   * различных типов сообщений. Она является центральным компонентом системы переходов
   * и обеспечивает:
   * 
   * **Функциональность переходов состояний:**
   * - Обработка условных переходов между узлами (if/elif структуры)
   * - Поддержка различных типов узлов (message, command, start, user-input)
   * - Автоматическое определение следующего узла на основе конфигурации
   * - Обработка ошибок при переходах
   * 
   * **Функциональность рендеринга сообщений:**
   * - Поддержка inline клав����атур �� различными типами кнопок
   * - Поддержка reply клавиатур с настройками раз��ера
   * - Обработка условных сообщений на основе ??анных пользователя
   * - Поддержка различных режимов форматирования (Markdown, HTML)
   * - Обработка прикрепленных медиафайлов
   * 
   * **Функциональность обработки ввода:**
   * - Настройка состояний ожидания пользовательского ввода
   * - Поддержка различных типов ввода (текст, фото, видео, аудио, документы)
   * - В���лидация входных данных с настраиваемыми параметрами
   * - Обработка узлов сбора данных через кнопки
   * 
   * **Поддерживаемые типы узлов:**
   * - Message узлы с различными типами клавиатур
   * - User-input узлы для сбора данных
   * - Command узлы для выполнения команд
   * - Start узлы для инициализации
   * - Узлы с условной логикой
   * 
   * **Генерируемые обработчики включают:**
   * - Создание inline и reply клавиатур
   * - Обр??ботку callback_data для кнопок
   * - Валидацию и сохранение пользовательского ввода
   * - Усло??ную логику отображения сообщений
   * - Навигаци?? между узлами с об??аботкой ошибок
   * 
   * @remarks
   * Функ????ия генерирует код, который обеспечивает плавную навигацию
   * и интерактивность в Telegram боте, поддерживая сложные сценарии диалогов
   * 
   * @example
   * // Сгенерированный код обеспечит:
   * // - Переходы между узлами по усло??иям
   * // - Создание интерактивных клавиатур
   * // - Обработку пользовательского ввода
   * // - Условное отображение сообщений
   */
  function generateStateTransitionAndRenderLogic() {
    code = newgenerateStateTransitionAndRenderLogic(nodes, code, allNodeIds, []);
  }

  /**
   * Собирает все callback-идентификаторы команд из узлов бота
   * 
   * Эта функция анализирует все узлы бота и извлекает информацию о кнопках,
   * которые связаны с выполнением команд. Она является ключевым компонентом
   * системы обнаружения и ре??истрации командных кнопок.
   * 
   * **Функциональность анализа узлов:**
   * - Перебор всех узлов бота для поиска командных кнопок
   * - Анализ обычных кнопок узлов
   * - Анализ кнопок в условных сообщениях
   * - Проверка различных типов действий кнопок
   * 
   * **Функциональность обработки кнопок:**
   * - Поиск кнопок с action === 'command'
   * - Извлечение команды из target поля кнопки
   * - Генерация уникальных callback идентификаторов
   * - Формирование имен функций обработчиков
   * 
   * **Поддерживаемые источники команд:**
   * - Обычные кнопки в узлах сообщений
   * - Кнопки в условных сообщениях
   * - Кнопки с различными типами действий
   * - Команды в различных форматах (/command, command)
   * 
   * **Генерируемые callback идентификаторы:**
   * - Формат: "cmd_" + command_name (без слеша)
   * - Уникальные идентификаторы для каждой команды
   * - Очистка специальных символов из имен команд
   * - Предотвращение дублирования идентификаторов
   * 
   * **Возвращаемое значение:**
   * - Set<string> с уникальными callback идентификаторами команд
   * - Используется для генерации обработчиков команд
   * - Логирование процесса обнаружения команд (если включено)
   * 
   * **Логирование и отладка:**
   * - Подробное логирование процесса поиска команд
   * - Информация о количестве найденных кнопок в каждом узле
   * - Детали о найденных командных кнопках
   * - Статистика по узлам без кнопок
   * 
   * @returns Множество уникальных callback идентификаторов для команд
   * 
   * @remarks
   * Функция обеспечивает полное обнаружение всех командных кнопок
   * в боте, что необходимо для корректной генерации обработчиков
   * 
   * @example
   * // Пример найденных командных кнопок:
   * // - Кнопка "Профиль" с command="/profile" -> "cmd_profile"
   * // - Кнопка "Настройки" с command="settings" -> "cmd_settings"
   * // - Условная кнопка "Админ" с command="/admin" -> "cmd_admin"
   */
  function collectAllCommandCallbacksFromNodes(): Set<string> {
    const commandButtons = new Set<string>();
    if (isLoggingEnabled()) isLoggingEnabled() && console.log('?? НАЧИНАяМ СБ??Р КНОПОК КОМАНД из', nodes.length, 'узлов');

    nodes.forEach(node => {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`?? Проверяем узел ${node.id} (тип: ${node.type})`);

      // Обычные кнопки узла
      if (node.data?.buttons) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`?? Узел ${node.id} имеет ${node.data.buttons.length} кнопок`);
        node.data.buttons.forEach((button: Button, index: number) => {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`  ?? Кнопка ${index}: "${button.text}" (action: ${button.action}, target: ${button.target})`);
          if (button.action === 'command' && button.target) {
            const commandCallback = `cmd_${button.target.replace('/', '')}`;
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`? НАЙДЕНА кнопка команды: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
            commandButtons.add(commandCallback);
          }
        });
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`? Узел ${node.id} не имеет кнопок`);
      }

      // Кнопки в условных сообщениях
      if (node.data?.conditionalMessages) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`?? Узел ${node.id} имеет ${node.data.conditionalMessages.length} условных сообщений`);
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.buttons) {
            condition.buttons.forEach((button: Button) => {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`  ?? Условная кнопка: "${button.text}" (action: ${button.action}, target: ${button.target})`);
              if (button.action === 'command' && button.target) {
                const commandCallback = `cmd_${button.target.replace('/', '')}`;
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`? НАЙДЕНА кнопка команды в условном сообщении: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
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
   * Добавляет обработчики callback-запросов для командных кнопок
   * 
   * Эта функция генерирует Python-код для обработки callback-запросов
   * от командных кнопок в Telegram боте. Она создает обработчики,
   * которые позволяют выполнять команды через нажатие на inline кнопки.
   * 
   * **Функциональност?????? генерации обработчиков:**
   * - Создание декораторов @dp.callback_query для каждой команды
   * - Генерация асинхронных функций-обработчиков
   * - Создание fake message объектов для симуляции команд
   * - Интеграция с существующими обработчиками команд
   * 
   * **Функциональность обработки команд:**
   * - Определение типа узла команды (start, command)
   * - Вызов соответствующих обработчиков команд
   * - Обработка команд без соответствующих узлов
   * - Логирование вып??лнения команд
   * 
   * **Генерируемые обработчики включают:**
   * - Декораторы для callback_query с фильтрацией по data
   * - Функции handle_cmd_[command_name] для каждой команды
   * - Создание FakeMessage объектов для совместимости
   * - Специальная обработка для start команд
   * - Обычная обработка для других команд
   * 
   * **Поддерживаемые типы команд:**
   * - Start команды (/start) - специальная обработка
   * - Обычные команды (/command) - стандартная обработка
   * - Команды без узлов - базовое уведомление
   * 
   * **Меха????изм работы:**
   * 1. Проверка наличия командных кнопок
   * 2. Генераци???????????? обработчика для каждой команды
   * 3. Создание fake message для с??муляции
   * 4. Поиск соответствующего узла команды
   * 5. Вызов подходящего обработчика
   * 
   * **Интеграция с существующ????????и обработчиками:**
   * - Совместимость с start_handler
   * - Совместимость с command handlers
   * - ????оддержка FakeMessageEdit для редактирования сообщ????????ий
   * - Сохранение контекста callback_query
   * 
   * @remarks
   * Функция обеспечивает полную функцион??льность выполнения команд
   * через callback кнопки, что расширяет возможности интерактивности бота
   * 
   * @example
   * // Пример генерируемого кода:
   * // @dp.callback_query(lambda c: c.data == "cmd_profile")
   * // async def handle_cmd_profile(callback_query: types.CallbackQuery):
   * //     await callback_query.answer()
   * //     logging.info("Обработка кнопки команды: cmd_profile -> /profile")
   * //     fake_message = SimpleNamespace()
   * //     fake_message.from_user = callback_query.from_user
   * //     await profile_handler(fake_message)
   */
  function addCommandCallbackHandlers() {
    if (commandButtons.size > 0) {
      code += '\n# Обработчики для кнопок команд\n';
      code += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;

      commandButtons.forEach(commandCallback => {
        const command = generateCommandCallbackHandlerWithSimulatedMessage(commandCallback);

        // Найти соответствующий обработчик команды
        generateCommandTriggerFromCallbackWithWrapper(command);
      });
    }
  }

  /**
   * Генерирует обработчик callback-запроса для команды с симуляцией сообщения
   * 
   * Эта функция создает Python-код для обработки callback-запросов от
   * командных кнопок и подготавливает среду для выполнения команды.
   * 
   * **Функциональность генерации обработчика:**
   * - Создание декоратора @dp.callback_query для конкретной команды
   * - Генерация асинхронной функции-обработчика
   * - Настройка логирования выполнения команды
   * - Создание fake message объекта для совместимости
   * 
   * **Функциональность симуляции:**
   * - Создание SimpleNamespace объекта для имитации сообщения
   * - Копирование необходимых полей из callback_query
   * - Настройка методов answer и edit_text
   * - Подготовка контекста для выполнения команды
   * 
   * **Генерируемые элементы кода:**
   * - Декоратор с фильтрацией по конкретному callback_data
   * - Функция handle_[commandCallback] с типизацией
   * - Ответ на callback_query для устранения загрузки
   * - Логирование факта выполнения команды
   * - Создание fake_message для передачи в обработчик
   * 
   * @param commandCallback Уникальный идентификатор callback для команды
   * @returns Имя команды без префикса "cmd_"
   * 
   * @remarks
   * Функция подготавливает инфраструктуру для выполнения команды
   * через callback кнопку, создавая необходимый контекст
   * 
   * @example
   * // При вызове с commandCallback = "cmd_profile"
   * // Генерируется:
   * // @dp.callback_query(lambda c: c.data == "cmd_profile")
   * // async def handle_cmd_profile(callback_query: types.CallbackQuery):
   * //     await callback_query.answer()
   * //     logging.info("Обработка кнопки команды: cmd_profile -> /profile")
   * //     fake_message = SimpleNamespace()
   * //     fake_message.from_user = callback_query.from_user
   */
  function generateCommandCallbackHandlerWithSimulatedMessage(commandCallback: string): string {
    const command = commandCallback.replace('cmd_', '');
    code += `\n@dp.callback_query(lambda c: c.data == "${commandCallback}")\n`;
    code += `async def handle_${commandCallback}(callback_query: types.CallbackQuery):\n`;
    code += '    await callback_query.answer()\n';
    code += `    logging.info(f"Обработка кнопки команды: ${commandCallback} -> /${command} (пользователь {callback_query.from_user.id})")\n`;
    code += `    # Симулияуем выполнение команды /${command}\n`;
    code += '    \n';
    code += '    # Создаем fake message object для команды\n';
    code += '    from types import SimpleNamespace\n';
    code += '    fake_message = SimpleNamespace()\n';
    code += '    fake_message.from_user = callback_query.from_user\n';
    code += '    fake_message.chat = callback_query.message.chat\n';
    code += '    fake_message.date = callback_query.message.date\n';
    code += '    fake_message.answer = callback_query.message.answer\n';
    code += '    fake_message.edit_text = callback_query.message.edit_text\n';
    code += '    \n';
    return command;
  }

  /**
   * Генерирует код триггера выполнения команды с оберткой
   * 
   * Эта функция создает Python-код для фактического выполнения команды
   * после получения callback-запроса. Она находит соответствующий узел
   * команды и генерирует код для его выполнения.
   * 
   * **Функциональность поиска команды:**
   * - Поиск узла команды в массиве nodes
   * - Поддержка различных форматов команд (/command, command)
   * - Определение типа узла (start, command)
   * - Обработка команд без соответствующих узлов
   * 
   * **Функциональность выполнения start команд:**
   * - Создание специального класса FakeMessageEdit
   * - Реализация методов answer и edit_text
   * - Интеграция с существующим start_handler
   * - Поддержка редактирования сообщений
   * 
   * **Функциональность выполнения обычных команд:**
   * - Поиск соответствующего command handler
   * - Генерация вызова [command]_handler
   * - Передача fake_message в обработчик
   * - Логирование выполнения команды
   * 
   * **Генерируемые элементы кода:**
   * - Условная логика для определения типа команды
   * - Создание FakeMessageEdit класса для start команд
   * - Генерация вызовов соответствующих обработчиков
   * - Fallback обработка для неизвестных команд
   * - Подробное логирование всех операций
   * 
   * **Поддерживаемые типы команд:**
   * - Start команды - используют start_handler
   * - Command команды - используют [name]_handler
   * - Неизвестные команды - базовое уведомление
   * 
   * **Параметры:**
   * - command: string - имя команды без префикса "cmd_"
   * 
   * @param command - Имя команды для выполнения
   * 
   * @remarks
   * Функция обеспечивает мост между callback обработчиком
   * и фактическими обработчиками команд бота
   * 
   * @example
   * // При вызове с command = "profile"
   * // Найден узел типа 'command' с command = "/profile"
   * // Генерируется:
   * // # Вызываем profile handler
   * // await profile_handler(fake_message)
   * // logging.info("Команда /profile выполнена через callback кнопку")
   */
  function generateCommandTriggerFromCallbackWithWrapper(command: string) {
    const commandNode = nodes.find(n => n.data.command === `/${command}` || n.data.command === command);
    if (commandNode) {
      if (commandNode.type === 'start') {
        code += '    # Вызываем start handler через edit_text\n';
        code += '    # Создаем специальный объект для редактирования сообщения\n';
        code += '    class FakeMessageEdit:\n';
        code += '        def __init__(self, callback_query):\n';
        code += '            self.from_user = callback_query.from_user\n';
        code += '            self.chat = callback_query.message.chat\n';
        code += '            self.date = callback_query.message.date\n';
        code += '            self.message_id = callback_query.message.message_id\n';
        code += '            self._callback_query = callback_query\n';
        code += '        \n';
        code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
        code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
        code += '        \n';
        code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
        code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
        code += '    \n';
        code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
        code += '    await start_handler(fake_edit_message)\n';
      } else if (commandNode.type === 'command') {
        code += `    # Вызываем ${command} handler\n`;
        code += `    await ${command}_handler(fake_message)\n`;
      }
    } else {
      code += `    await callback_query.message.edit_text("Команда /${command} выполнена")\n`;
    }
    code += `    logging.info(f"Команда /${command} выполнена через callback кнопку (пользователь {callback_query.from_user.id})")\n`;
  }

  /**
   * Генерирует обработчики событий для групп бота
   * Создает Python код для обработки групповых событий и взаимодействий
   */
  function generateGroupBasedEventHandlers() {
    code += '\n';

    code += generateGroupHandlers(groups);
  }

  /**
   * Генерирует fallback обработчики для необработанных сообщений
   * Создает обработчики для текстовых сообщений и фотографий, которые не были обработаны основными обработчиками
   */
  function generateFallbackHandlers() {
    if (userDatabaseEnabled) {
      fallback_text_handler();

      // Добавляем универсальный обработчик для фотографий
      handle_unhandled_photo();
    }
  }

  /**
   * Генерирует fallback обработчик для необработанных текстовых сообщений
   * Создает Python функцию для обработки всех текстовых сообщений, которые не были обработаны основными обработчиками
   */
  function fallback_text_handler() {
    code += '\n# Универсальный fallback-обработчик для всех необработанных текстовых сообщений\n';
    code += '@dp.message(F.text)\n';
    code += 'async def fallback_text_handler(message: types.Message):\n';
    code += '    """\n';
    code += '    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.\n';
    code += '    Благодаря middleware, сообщение уже сохранено в БД.\n';
    code += '    Этот обработчик просто логирует факт необработанного сообщения.\n';
    code += '    """\n';
    code += '    logging.info(f"?? Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")\n';
    code += '    # Можно отправить ответ пользователю (опционально)\n';
    code += '    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")\n\n';
  }

  /**
   * Генерирует fallback обработчик для необработанных фотографий
   * Создает Python функцию для обработки всех фотографий, которые не были обработаны основными обработчиками
   */
  function handle_unhandled_photo() {
    code += '\n# Универсальный обработчик для необработанных фото\n';
    code += '@dp.message(F.photo)\n';
    code += 'async def handle_unhandled_photo(message: types.Message):\n';
    code += '    """\n';
    code += '    Обрабатывает фотографии, которые не были обработаны другими обработчиками.\n';
    code += '    Благодаря middleware, фото уже будет сохранено в БД.\n';
    code += '    """\n';
    code += '    logging.info(f"?? Получено фото от пользователя {message.from_user.id}")\n';
    code += '    # Middleware автоматически сохранит фото\n';
    code += '\n';
  }

  /**
   * Генерирует каркас основной функции с обработчиками сигналов
   * Создает Python функцию main() с обработчиками сигналов для корректного завершения работы бота
   */
  function signal_handler() {
    code += '\n\n# Запуск бота\n';
    code += 'async def main():\n';
    if (userDatabaseEnabled) {
      code += '    global db_pool\n';
    }
    code += '    \n';
    code += '    # Обработчик сигналов для корректного завершения\n';
    code += '    def signal_handler(signum, frame):\n';
    code += '        print(f"?? Получен сигнал {signum}, начинаем корректное завершение...")\n';
    code += '        import sys\n';
    code += '        sys.exit(0)\n';
    code += '    \n';
    code += '    # Регистрируем обработчики сигналов\n';
    code += '    signal.signal(signal.SIGTERM, signal_handler)\n';
    code += '    signal.signal(signal.SIGINT, signal_handler)\n';
    code += '    \n';
    code += '    try:\n';
  }

  /**
   * Генерирует код инициализации бота и настройки middleware
   * Создает Python код для инициализации базы данных, команд меню и middleware для логирования
   */
  function generateBotInitializationAndMiddlewareSetup() {
    if (userDatabaseEnabled) {
      code += '        # Инициализируем базу данных\n';
      code += '        await init_database()\n';
    }
    if (menuCommands.length > 0) {
      code += '        await set_bot_commands()\n';
    }
    code += '        \n';
    if (userDatabaseEnabled) {
      code += '        # Регистрация middleware для сохранения сообщений\n';
      code += '        dp.message.middleware(message_logging_middleware)\n';
      // Регистрируем callback_query middleware только если в боте есть inline кнопки
      if (hasInlineButtons(nodes || [])) {
        code += '        dp.callback_query.middleware(callback_query_logging_middleware)\n';
      }
      code += '        \n';
    }
  }

  /**
   * Генерирует основной цикл опроса с корректным завершением работы
   * Создает Python код для запуска polling бота и корректного закрытия всех соединений при завершении
   */
  function generateMainPollingLoopWithGracefulShutdown() {
    code += '        print("рџљЂ Р‘РѕС‚ Р·Р°РїСѓС‰РµРЅ Рё РіРѕС‚РѕРІ Рє СЂР°Р±РѕС‚Рµ!")\n';
    code += '        await dp.start_polling(bot)\n';
    code += '    except KeyboardInterrupt:\n';
    code += '        print("вљ Рё РџРѕР»СѓС‡РµРЅ СЃРёРіРЅР°Р» РѕСЃС‚Р°РЅРѕРІРєРё, Р·Р°РІРµСЂС€Р°РµРј СЂР°Р±РѕС‚Сѓ...")\n';
    code += '    except SystemExit:\n';
    code += '        print("вљ Рё РЎРёСЃС‚РµРјРЅРѕРµ Р·Р°РІРµСЂС€РµРЅРёРµ, Р·Р°РІРµСЂС€Р°РµРј СЂР°Р±РѕС‚Сѓ...")\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"РћС€РёР±РєР°: {e}")\n';
    code += '    finally:\n';
    code += '        # Р—Р°РєСЂС‹С‚РёРµ СЃРѕРµРґРёРЅРµРЅРёР№ РїСЂРё РІС‹С…РѕРґРµ\n';
    if (userDatabaseEnabled) {
      code += '        if db_pool:\n';
      code += '            await db_pool.close()\n';
    }
    code += '        \n';
    code += '        # Закрываем сессию бота\n';
    code += '        await bot.session.close()\n';
    code += '\n';
  }

  /**
   * Идентифицирует узлы, требующие логику множественного выбора
   * Находит все узлы в графе с включенной опцией множественного выбора и возвращает их список
   * @returns {Array<Node>} Массив узлов с множественным выбором
   */

  /**
   * Генерирует обработчик callback-запросов для множественного выбора
   * Создает Python функцию для обработки inline кнопок множественного выбора, включая кнопки "Готово"
   */
  function handle_multi_select_callback() {
    if (multiSelectNodes.length > 0) {
      code += '\n# Обработчики для множественного выбора\n';

      // Обработчик для inline кнопок множественного выбора
      code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
      code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
      code += '    await callback_query.answer()\n';
      code += '    user_id = callback_query.from_user.id\n';
      code += '    # Инициализируем базовые переменные пользователя\n';
      code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
      code += '    \n';
      code += '    callback_data = callback_query.data  # Получаем данные callback\n';
      code += '    \n';
      code += '    # Обработка кнопки "Готово"\n';
      code += '    if callback_data.startswith("done_"):\n';
      code += '        # Завершение множественного выбора (новый формат)\n';
      code += '        logging.info(f"?? Обработка кнопки Готово: {callback_data}")\n';
      code += '        short_node_id = callback_data.replace("done_", "")\n';
      code += '        # Находим полный node_id по короткому суффиксу\n';
      code += '        node_id = None\n';
      multiSelectNodes.forEach((node: Node) => {
        const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
        code += `        if short_node_id == "${shortNodeId}":\n`;
        code += `            node_id = "${node.id}"\n`;
        code += `            logging.info(f"? Найден узел: ${node.id}")\n`;
      });
      code += '    elif callback_data.startswith("multi_select_done_"):\n';
      code += '        # Завершение множественного выбора (старый формат)\n';
      code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
      code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
      code += '        \n';
      code += '        # Сохраняем выбранные опции в базу данных\n';
      code += '        if selected_options:\n';
      code += '            selected_text = ", ".join(selected_options)\n';

      // Генерируем сохранение для каждого узла с его переменной
      generateMultiSelectDataPersistenceAndCleanupCode();

      // Добавим переходы для узлов с множественным выбором
      code = generateTransitionLogicForMultiSelectCompletion(
        code,
        multiSelectNodes,
        nodes,
        [],
        allNodeIds,
        isLoggingEnabled,
        generateInlineKeyboardCode,
        formatTextForPython
      );
    }
  }

  /**
   * Генерирует код сохранения данных множественного выбора и очистки состояния
   * Создает Python код для сохранения выбранных опций множественного выбора в базу данных
   * и очистки временных данных пользователя после завершения операции
   */
  function generateMultiSelectDataPersistenceAndCleanupCode() {
    multiSelectNodes.forEach((node: Node) => {
      const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
      code += `            if node_id == "${node.id}":\n`;
      code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    });

    code += '            # Резервное сохранение если узел не найден\n';
    code += '            if not any(node_id == node for node in [' + multiSelectNodes.map(n => `"${n.id}"`).join(', ') + ']):\n';
    code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
    code += '        \n';
    code += '        # Очищаем состояние множественного выбора\n';
    code += '        if user_id in user_data:\n';
    code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
    code += '            user_data[user_id].pop("multi_select_node", None)\n';
    code += '        \n';
    code += '        # Переходим к следующему узлу, если указан\n';
  }


}


// ============================================================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================================================

/**
 * Интерфейс для описания диапазона строк кода, связанного с определенным узлом
 */
export interface CodeNodeRange {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Номер начальной строки кода */
  startLine: number;
  /** Номер конечной строки кода */
  endLine: number;
}

/**
 * Интерфейс для представления кода вместе с картой узлов
 */
export interface CodeWithMap {
  /** Строковое представление кода */
  code: string;
  /** Массив диапазонов строк, связанных с узлами кода */
  nodeMap: CodeNodeRange[];
}

// Повторный экспорт функций каркаса
export { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile };
// ============================================================================
// ТИПЫ ДЛЯ УЗЛОВ БОТА
// ============================================================================

export interface BotNode {
  type: string;
  data: {
    buttons?: Button[];
    [key: string]: any;
  };
  [key: string]: any;
}






