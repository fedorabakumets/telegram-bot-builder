// Внешние зависимости
import { z } from 'zod';
import { BotData, Node, BotGroup, buttonSchema } from '@shared/schema';

// Внутренние модули - использование экспорта бочек
import { generateBotFatherCommands } from './commands';
import { generateSynonymHandlers } from './Synonyms';
import { generateConditionalButtonHandlerCode, hasConditionalValueButtons } from './Conditional/conditional-button-handler';
import {
  extractNodesAndConnections,
  formatTextForPython} from './format';
import { generateInlineKeyboardCode } from './Keyboard';
import { hasMediaNodes } from './utils/hasMediaNodes';
import { hasInlineButtons } from './utils/hasInlineButtons';
import { hasAutoTransitions } from './utils/hasAutoTransitions';
import { generateRequirementsTxt, generateDockerfile, generateReadme, generateConfigYaml } from './scaffolding';
import { processInlineButtonNodes } from './Keyboard/processInlineButtonNodes';
import { processConnectionTargets } from './utils/processConnectionTargets';
import { collectInputTargetNodes } from './utils/collectInputTargetNodes';
import { filterInlineNodes } from './Keyboard/filterInlineNodes';
import { addInputTargetNodes } from './utils/addInputTargetNodes';
import { generateDatabaseCode, generateNodeNavigation, generateUtf8EncodingCode, generateSafeEditOrSendCode, generateBasicBotSetupCode, generateGroupsConfiguration, generateUtilityFunctions } from './generate';
import { generateMessageLoggingCode } from './generate/generate-message-logging';
import { extractNodeData } from './utils/extractNodeData';
import { generateUniversalVariableReplacement } from './utils/generateUniversalVariableReplacement';
import { collectConditionalMessageButtons } from './Conditional/collectConditionalMessageButtons';
import { addAutoTransitionNodes } from './utils/addAutoTransitionNodes';
import { generateNodeHandlers } from './generate/generate-node-handlers';
import { generateBotCommandsSetup } from './bot-commands-setup';
import { generateButtonResponseHandlers } from './Keyboard/generateButtonResponseHandlers';
import { generateReplyButtonHandlers } from './Keyboard/generate-reply-button-handlers';
import { generateMultiSelectReplyHandler } from './Keyboard/generateMultiSelectReplyHandler';
import { generateGroupHandlers } from './MediaHandler/generateGroupHandlers';
import { generateMultiSelectDoneHandler } from './Keyboard/generateMultiSelectDoneHandler';
import { generateMultiSelectCallbackLogic } from './Keyboard/generateMultiSelectCallbackLogic';
import { generateMediaFileFunctions } from './MediaHandler/generateMediaFileFunctions';
import { newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation } from './newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation';
import { newprocessNodeButtonsAndGenerateHandlers } from './newprocessNodeButtonsAndGenerateHandlers';
import { newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation } from './newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation';
import { newgenerateStateTransitionAndRenderLogic } from './newgenerateStateTransitionAndRenderLogic';


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
 * Анализирует и логирует структуру узлов и связей для отладки.
 * @param {any[]} nodes - Массив узлов.
 * @param {any[]} connections - Массив связей.
 */
const logFlowAnalysis = (nodes: any[], connections: any[]) => {
  if (!isLoggingEnabled()) return;

  console.log(`🔧 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}, связей - ${connections?.length || 0}`);

  if (nodes && nodes.length > 0) {
    console.log('🔧 ГЕНЕРАТОР: Анализируем все узла:');
    nodes.forEach((node, index) => {
      console.log(`🔧 ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
      console.log(`🔧 ГЕНЕРАТОР:   - allowMultipleSelection: ${node.data.allowMultipleSelection}`);
      console.log(`🔧 ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
      console.log(`🔧 ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
      console.log(`🔧 ГЕНЕРАТОР:   - continueButtonTarget: ${node.data.continueButtonTarget || 'нет'}`);

      if (node.id === 'interests_result') {
        console.log(`🚨 ГЕНЕРАТОР: НАЙДЕН interests_result!`);
        console.log(`🚨 ГЕНЕРАТОР: interests_result полные данные:`, JSON.stringify(node.data, null, 2));
      }
    });
  }

  if (connections && connections.length > 0) {
    console.log('🔧 ГЕНЕРАТОР: Анализируем связи:');
    connections.forEach((conn, index) => {
      console.log(`🔧 ГЕНЕРАТОР: Связь ${index + 1}: ${conn.source} -> ${conn.target}`);
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
 * @returns {string} Сгенерированный Python-код для бота
 */
export function generatePythonCode(botData: BotData, botName: string = "MyBot", groups: BotGroup[] = [], userDatabaseEnabled: boolean = false, projectId: number | null = null, enableLogging: boolean = false): string {
  // Устанавливаем флаг глобального логирования для этого запуска генерации
  globalLoggingEnabled = enableLogging;

  const { nodes, connections } = extractNodesAndConnections(botData);

  const { allNodeIds, mediaVariablesMap } = extractNodeData(nodes || []);

  // Анализируем и логируем поток
  logFlowAnalysis(nodes, connections);

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

  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы
  code += generateSafeEditOrSendCode(hasInlineButtons(nodes || []), hasAutoTransitions(nodes || []));

  code += generateBasicBotSetupCode();

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

 

 

  // Добавляем утилитарные функции
  code += generateUtilityFunctions(userDatabaseEnabled);

  // Функции для работы с файлами - только если есть медиа
  if (hasMediaNodes(nodes || [])) {
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
  code += generateNodeHandlers(nodes || [], userDatabaseEnabled);

  // Генерируем обработчики синонимов для всех узлов
  code += generateSynonymHandlers(nodes || []);

  // Генерируем обработчики обратного вызова для inline кнопок И целевых узлов ввода
  const inlineNodes = filterInlineNodes(nodes || []);

  // Также собираем все целевые узла из коллекций пользовательского ввода
  const inputTargetNodeIds = collectInputTargetNodes(nodes || []);

  // Собираем все идентификаторы ссылочных узлов и кнопки условных сообщений
  const allReferencedNodeIds = new Set<string>();
  const allConditionalButtons = new Set<string>();

  // Добавляем узла из inline кнопок
  processInlineButtonNodes(inlineNodes, allReferencedNodeIds);

  // Собираем кнопки из условных сообщений
  collectConditionalMessageButtons(nodes || [], allConditionalButtons);

  // Добавляем целевые узла ввода
  addInputTargetNodes(inputTargetNodeIds, allReferencedNodeIds);

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем узла, которые являются целями автопереходов
  addAutoTransitionNodes(nodes || [], allReferencedNodeIds);

  // Добавляем все цели подключения, чтобы обеспечить наличие обработчика у каждого подключенного узла
  processConnectionTargets(connections, allReferencedNodeIds);

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

  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ИТОГО найдено кнопок команд: ${commandButtons.size}`);
  if (isLoggingEnabled()) isLoggingEnabled() && console.log('📝 Список найденных кнопок команд:', Array.from(commandButtons));

  addCommandCallbackHandlers();

  // Обработчики кнопок ответов уже добавлены выше, перед универсальным обработчиком тттекста
  generateGroupBasedEventHandlers();

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  generateFallbackHandlers();

  generateMainFunctionScaffoldWithSignalHandlers();
  generateBotInitializationAndMiddlewareSetup();
  generateMainPollingLoopWithGracefulShutdown();

  // Найдем узла с множественным выбором для использования в обработчиках
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic();

  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  generateMultiSelectCallbackDispatcherHandle();

  return generateCompleteBotScriptFromNodeGraph();

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
    code = newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation(inlineNodes, allReferencedNodeIds, allConditionalButtons, code, processNodeButtonsAndGenerateHandlers, nodes, allNodeIds, connections, userDatabaseEnabled, mediaVariablesMap);
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
    code = newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes, code, allNodeIds, connections, generateAdHocInputCollectionHandler, generateContinuationLogicForButtonBasedInput, generateUserInputValidationAndContinuationLogic, generateStateTransitionAndRenderLogic);
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
    code += '                logging.info(f"✅ Данные сохранены в БД: {input_variable} = {user_text} (пользователь {user_id})")\n';
    code += '            else:\n';
    code += '                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
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
        code += generateUniversalVariableReplacement('                ');

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
        code += generateUniversalVariableReplacement('                ');

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
        code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбяра ${targetNode.id} выполнена")\n`;
      } else {
        // Для обычных узлов отправляем простое сообщение
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                # Обычный узел - отправляем сообщение ${targetNode.id}\n`;
        code += `                text = ${formattedText}\n`;

        // Замена переменных
        code += '                user_data[user_id] = user_data.get(user_id, {})\n';
        code += generateUniversalVariableReplacement('                ');

        if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += `                await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                await message.answer(text)\n`;
        }
        code += `                logging.info(f"✅ Навигация к обычному узлу ${targetNode.id} выполнена")\n`;
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
    code += '            await message.answer("✅ Дополнительный комментарий сохранен!")\n';
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
    code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
    code += '        return\n';
    code += '    \n';
    code += '    if max_length > 0 and len(user_text) > max_length:\n';
    code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте ещя раз.")\n';
    code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
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
    code += '            await message.answer(f"❌ Неверный фярмат email. {retry_message}")\n';
    code += '            return\n';
    code += '    \n';
    code += '    elif input_type == "number":\n';
    code += '        try:\n';
    code += '            float(user_text)\n';
    code += '        except ValueError:\n';
    code += '            retry_message = input_config.get("retry_message", "Пожалуйста, пояробуйтя еще раз.")\n';
    code += '            await message.answer(f"❌ Введите корректное чясло. {retry_message}")\n';
    code += '            return\n';
    code += '    \n';
    code += '    elif input_type == "phone":\n';
    code += '        import re\n';
    code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
    code += '        if not re.match(phone_pattern, user_text):\n';
    code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще ряз.")\n';
    code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
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
    code += '            logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
    code += '        else:\n';
    code += '            logging.warning(f"⚠️ Не удалось сохранить в яД, данные сохранены ляякально")\n';
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
    code += '    logging.info(f"🔄 Проверяям навияяяяацию: next_node_id = {next_node_id}")\n';
    code += '    if next_node_id:\n';
    code += '        try:\n';
    code += '            logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
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
   * - Поддержка inline клавиатур с различными типами кнопок
   * - Поддержка reply клавиатур с настройками размера
   * - Обработка условных сообщений на основе данных пользователя
   * - Поддержка различных режимов форматирования (Markdown, HTML)
   * - Обработка прикрепленных медиафайлов
   * 
   * **Функциональность обработки ввода:**
   * - Настройка состояний ожидания пользовательского ввода
   * - Поддержка различных типов ввода (текст, фото, видео, аудио, документы)
   * - Валидация входных данных с настраиваемыми параметрами
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
   * - Обработку callback_data для кнопок
   * - Валидацию и сохранение пользовательского ввода
   * - Условную логику отображения сообщений
   * - Навигацию между узлами с обработкой ошибок
   * 
   * @remarks
   * Функция генерирует код, который обеспечивает плавную навигацию
   * и интерактивность в Telegram боте, поддерживая сложные сценарии диалогов
   * 
   * @example
   * // Сгенерированный код обеспечит:
   * // - Переходы между узлами по условиям
   * // - Создание интерактивных клавиатур
   * // - Обработку пользовательского ввода
   * // - Условное отображение сообщений
   */
  function generateStateTransitionAndRenderLogic() {
    code = newgenerateStateTransitionAndRenderLogic(nodes, code, allNodeIds, connections);
  }

  /**
   * Собирает все callback-идентификаторы команд из узлов бота
   * 
   * Эта функция анализирует все узлы бота и извлекает информацию о кнопках,
   * которые связаны с выполнением команд. Она является ключевым компонентом
   * системы обнаружения и регистрации командных кнопок.
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
    if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔍 НАЧИНАяМ СБОР КНОПОК КОМАНД из', nodes.length, 'узлов');

    nodes.forEach(node => {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔎 Проверяем узел ${node.id} (тип: ${node.type})`);

      // Обычяые кнопки узла
      if (node.data.buttons) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 Узел ${node.id} имеет ${node.data.buttons.length} кнопок`);
        node.data.buttons.forEach((button: Button, index: number) => {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`  🔘 Кнопка ${index}: "${button.text}" (action: ${button.action}, target: ${button.target})`);
          if (button.action === 'command' && button.target) {
            const commandCallback = `cmd_${button.target.replace('/', '')}`;
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ НАЙДЕНА кнопка команды: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
            commandButtons.add(commandCallback);
          }
        });
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`❌ Узел ${node.id} не имеет кнопок`);
      }

      // Кнопки в условных сообщениях
      if (node.data.conditionalMessages) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📨 Узел ${node.id} имеет ${node.data.conditionalMessages.length} условных сообщений`);
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.buttons) {
            condition.buttons.forEach((button: Button) => {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`  🔘 Условная кнопка: "${button.text}" (action: ${button.action}, target: ${button.target})`);
              if (button.action === 'command' && button.target) {
                const commandCallback = `cmd_${button.target.replace('/', '')}`;
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ НАЙДЕНА кнопка команды в условном сообщении: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
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
   * **Функциональность генерации обработчиков:**
   * - Создание декораторов @dp.callback_query для каждой команды
   * - Генерация асинхронных функций-обработчиков
   * - Создание fake message объектов для симуляции команд
   * - Интеграция с существующими обработчиками команд
   * 
   * **Функциональность обработки команд:**
   * - Определение типа узла команды (start, command)
   * - Вызов соответствующих обработчиков команд
   * - Обработка команд без соответствующих узлов
   * - Логирование выполнения команд
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
   * **Механизм работы:**
   * 1. Проверка наличия командных кнопок
   * 2. Генерация обработчика для каждой команды
   * 3. Создание fake message для симуляции
   * 4. Поиск соответствующего узла команды
   * 5. Вызов подходящего обработчика
   * 
   * **Интеграция с существующими обработчиками:**
   * - Совместимость с start_handler
   * - Совместимость с command handlers
   * - Поддержка FakeMessageEdit для редактирования сообщений
   * - Сохранение контекста callback_query
   * 
   * @remarks
   * Функция обеспечивает полную функциональность выполнения команд
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
      generateFallbackTextMessageHandler();

      // Добавляем универсальный обработчик для фотографий
      generateFallbackPhotoMessageHandler();
    }
  }

  /**
   * Генерирует fallback обработчик для необработанных текстовых сообщений
   * Создает Python функцию для обработки всех текстовых сообщений, которые не были обработаны основными обработчиками
   */
  function generateFallbackTextMessageHandler() {
    code += '\n# Универсальный fallback-обработчик для всех необработанных текстовых сообщений\n';
    code += '@dp.message(F.text)\n';
    code += 'async def fallback_text_handler(message: types.Message):\n';
    code += '    """\n';
    code += '    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.\n';
    code += '    Благодаря middleware, сообщение уже сохранено в БД.\n';
    code += '    Этот обработчик просто логирует факт необработанного сообщения.\n';
    code += '    """\n';
    code += '    logging.info(f"💬 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")\n';
    code += '    # Можно отправить ответ пользователю (опционально)\n';
    code += '    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")\n\n';
  }

  /**
   * Генерирует fallback обработчик для необработанных фотографий
   * Создает Python функцию для обработки всех фотографий, которые не были обработаны основными обработчиками
   */
  function generateFallbackPhotoMessageHandler() {
    code += '\n# Универсальный обработчик для необработанных фото\n';
    code += '@dp.message(F.photo)\n';
    code += 'async def handle_unhandled_photo(message: types.Message):\n';
    code += '    """\n';
    code += '    Обрабатывает фотографии, которые не были обработаны другими обработчиками.\n';
    code += '    Благодаря middleware, фото уже будет сохранено в БД.\n';
    code += '    """\n';
    code += '    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")\n';
    code += '    # Middleware автоматически сохранит фото\n';
    code += '\n';
  }

  /**
   * Генерирует каркас основной функции с обработчиками сигналов
   * Создает Python функцию main() с обработчиками сигналов для корректного завершения работы бота
   */
  function generateMainFunctionScaffoldWithSignalHandlers() {
    code += '\n\n# Запуск бота\n';
    code += 'async def main():\n';
    if (userDatabaseEnabled) {
      code += '    global db_pool\n';
    }
    code += '    \n';
    code += '    # Обработчик сигналов для корректного завершения\n';
    code += '    def signal_handler(signum, frame):\n';
    code += '        print(f"🛑 Получен сигнал {signum}, начинаем корректное завершение...")\n';
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
    code += '        print("🤖 Бот запущен и готов к работе!")\n';
    code += '        await dp.start_polling(bot)\n';
    code += '    except KeyboardInterrupt:\n';
    code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
    code += '    except SystemExit:\n';
    code += '        print("🛑 Системное завершение, завершаем работу...")\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Критическая ошибка: {e}")\n';
    code += '    finally:\n';
    code += '        # Правильно закрываем все соединения\n';
    if (userDatabaseEnabled) {
      code += '        if db_pool:\n';
      code += '            await db_pool.close()\n';
    }
    code += '        \n';
    code += '        # Закрываем сессию бота\n';
    code += '        await bot.session.close()\n';
  }

  /**
   * Идентифицирует узлы, требующие логику множественного выбора
   * Находит все узлы в графе с включенной опцией множественного выбора и возвращает их список
   * @returns {Array<Node>} Массив узлов с множественным выбором
   */
  function identifyNodesRequiringMultiSelectLogic() {
    const multiSelectNodes = (nodes || []).filter((node: Node) => node.data.allowMultipleSelection
    );
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`, multiSelectNodes.map(n => n.id));
    return multiSelectNodes;
  }

  /**
   * Генерирует обработчик callback-запросов для множественного выбора
   * Создает Python функцию для обработки inline кнопок множественного выбора, включая кнопки "Готово"
   */
  function generateMultiSelectCallbackDispatcherHandle() {
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
      code += '    callback_data = callback_query.data\n';
      code += '    \n';
      code += '    # Обработка кнопки "Готово"\n';
      code += '    if callback_data.startswith("done_"):\n';
      code += '        # Завершение множественного выбора (новый формат)\n';
      code += '        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")\n';
      code += '        short_node_id = callback_data.replace("done_", "")\n';
      code += '        # Находим полный node_id по короткому суффиксу\n';
      code += '        node_id = None\n';
      multiSelectNodes.forEach((node: Node) => {
        const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
        code += `        if short_node_id == "${shortNodeId}":\n`;
        code += `            node_id = "${node.id}"\n`;
        code += `            logging.info(f"✅ Найден узел: ${node.id}")\n`;
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
      generateTransitionLogicForMultiSelectCompletion();
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

  /**
   * Генерирует логику переходов для завершения множественного выбора в Telegram боте.
   * 
   * Эта функция создает обработчики callback'ов для завершения операций множественного выбора.
   * Она анализирует узлы множественного выбора и генерирует соответствующий Python код для:
   * 
   * - Определения следующего узла для каждого node_id после завершения выбора
   * - Обработки continueButtonTarget (прямые переходы к узлам)
   * - Обработки соединений между узлами (если continueButtonTarget не указан)
   * - Поддержки различных типов целевых узлов (message, command, start)
   * - Правильной обработки inline клавиатур для целевых узлов
   * - Генерации безопасного кода с логированием и обработкой ошибок
   * 
   * Логика переходов:
   * 1. Сначала проверяется continueButtonTarget для прямого перехода
   * 2. Если continueButtonTarget не указан, ищутся соединения из текущего узла
   * 3. Для каждого типа целевого узла генерируется специфичный код:
   *    - message: отправка сообщения с возможной inline клавиатурой
   *    - command: вызов соответствующего обработчика команды
   *    - start: вызов полного обработчика start для главного меню
   * 4. Добавляется обработка ошибок и fallback логика
   * 
   * Функция использует глобальные переменные:
   * - multiSelectNodes: массив узлов множественного выбора
   * - nodes: все узлы графа
   * - connections: массив соединений между узлами
   * - allNodeIds: список всех идентификаторов узлов
   * - isLoggingEnabled: функция проверки включения логирования
   * - generateInlineKeyboardCode: функция генерации inline клавиатур
   * 
   * @returns {void} Функция модифицирует глобальную переменную code, добавляя сгенерированный Python код
   */
  function generateTransitionLogicForMultiSelectCompletion() {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Обрабатываем ${multiSelectNodes.length} узлов множественного выбора для переходов`);
    code += '        # Определяем следующий узел для каждого node_id\n';
    multiSelectNodes.forEach((node: Node) => {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Создаем блок if для узла ${node.id}`);
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget: ${node.data.continueButtonTarget}`);
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: соединения из узла: ${connections.filter(conn => conn.source === node.id).map(c => c.target).join(', ')}`);

      code += `        if node_id == "${node.id}":\n`;

      let hasContent = false;

      // Сначала проверяем continueButtonTarget
      if (node.data.continueButtonTarget) {
        const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
        if (targetNode) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через continueButtonTarget`);
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Тип целевого узла: ${targetNode.type}`);
          code += `            # Переход к узлу ${targetNode.id}\n`;
          code += `            logging.info(f"🔄 Переходим к узлу ${targetNode.id} (тип: ${targetNode.type})")\n`;
          if (targetNode.type === 'message') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик, отправляем сообщение`);
            const messageText = targetNode.data.messageText || "Продолжение...";
            const formattedText = formatTextForPython(messageText);
            code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
            code += `            text = ${formattedText}\n`;

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
              code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для целевого узла\n`;
              code += `            # Загружаем пользовательские данные для клавиатуры\n`;
              code += `            user_vars = await get_user_from_db(user_id)\n`;
              code += `            if not user_vars:\n`;
              code += `                user_vars = user_data.get(user_id, {})\n`;
              code += `            if not isinstance(user_vars, dict):\n`;
              code += `                user_vars = {}\n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
              code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `            await callback_query.message.answer(text)\n`;
            }
            code += `            return\n`;
            hasContent = true;
          } else if (targetNode.type === 'command') {
            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Добавляем вызов handle_command_${safeCommandName}`);
            code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            hasContent = true;
          } else if (targetNode.type === 'start') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Вызываем полный обработчик start для правильной клавиатуры`);
            code += `            # Вызываем полный обработчик start для правильного отображения главного меню\n`;
            code += `            await handle_command_start(callback_query.message)\n`;
            code += `            return\n`;
            hasContent = true;
          } else {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Неизвестный тип узла ${targetNode.type}, добавляем pass`);
            code += `            logging.warning(f"⚠️ Неизвестный тип узла: ${targetNode.type}")\n`;
            code += `            pass\n`;
            hasContent = true;
          }
        } else {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Целевой узел не найден для continueButtonTarget: ${node.data.continueButtonTarget}`);
          // Если целевой узел не найден, просто завершаем выбор без перехода
          code += `            # Целевой узел не найден, завершаем выбор\n`;
          code += `            logging.warning(f"⚠️ Целевой узел не найден: ${node.data.continueButtonTarget}")\n`;
          code += `            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
          hasContent = true;
        }
      } else {
        // Если нет continueButtonTarget, ищем соединения
        const nodeConnections = connections.filter(conn => conn.source === node.id);
        if (nodeConnections.length > 0) {
          const targetNode = nodes.find(n => n.id === nodeConnections[0].target);
          if (targetNode) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через соединение`);
            code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
            if (targetNode.type === 'message') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик через соединение`);
              const messageText = targetNode.data.messageText || "Продолжение...";
              const formattedText = formatTextForPython(messageText);
              code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
              code += `            text = ${formattedText}\n`;

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для соединения ${targetNode.id}`);
                code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для соединения\n`;
                code += `            # Загружаем пользовательские данные для клавиатуры\n`;
                code += `            user_vars = await get_user_from_db(user_id)\n`;
                code += `            if not user_vars:\n`;
                code += `                user_vars = user_data.get(user_id, {})\n`;
                code += `            if not isinstance(user_vars, dict):\n`;
                code += `                user_vars = {}\n`;
                code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
                code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += `            await callback_query.message.answer(text)\n`;
              }
              code += `            return\n`;
            } else if (targetNode.type === 'command') {
              const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
              code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            }
            hasContent = true;
          }
        }
      }

      // Если блок if остался пустым, добавляем return
      if (!hasContent) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Блок if для узла ${node.id} остался пустым, добавляем return`);
        code += `            return\n`;
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Блок if для узла ${node.id} заполнен контентом`);
      }
    });
  }

  /**
   * Генерирует полный скрипт бота из графа узлов
   * @returns {string} Сгенерированный код бота
   */
  function generateCompleteBotScriptFromNodeGraph() {
    code += '        return\n';
    code += '    \n';

    // Добавляем логику обработки мультиселекта
    code += generateMultiSelectCallbackLogic(multiSelectNodes, allNodeIds, isLoggingEnabled);

    // Добавляем обработчик завершения мультиселекта
    code += generateMultiSelectDoneHandler(nodes || [], multiSelectNodes, allNodeIds, isLoggingEnabled);

    // Закрываем if (multiSelectNodes.length > 0)
    // Добавляем обработчик ответов на мультиселект
    code += generateMultiSelectReplyHandler(nodes || [], allNodeIds, isLoggingEnabled);

    // Добавляем точку входа для запуска приложения
    code += 'if __name__ == "__main__":\n';
    code += '    asyncio.run(main())\n';

    return code;
  }

  /**
   * Обрабатывает кнопки узлов и генерирует обработчики callback-запросов для Telegram бота.
   * 
   * Эта функция является ключевым компонентом генератора ботов, который:
   * - Перебирает все inline узлы и их кнопки
   * - Создает уникальные обработчики для callback-запросов кнопок
   * - Избегает дублирования обработчиков для одинаковых callback_data
   * - Генерирует Python код для обработки различных типов кнопок и узлов
   * - Поддерживает множественные типы узлов (message, sticker, voice, animation, location, contact, user-input, start, command)
   * - Реализует логику множественного выбора с кнопкой "Готово"
   * - Обрабатывает условные сообщения и клавиатуры
   * - Управляет состоянием ожидания пользовательского ввода
   * 
   * @param processedCallbacks - Set для отслеживания уже обработанных callback_data,
   *                             предотвращает создание дублирующих обработчиков
   * 
   * Основные блоки логики:
   * 1. Обработка кнопок с действием 'goto' - создание обработчиков для навигации между узлами
   * 2. Обработка множественного выбора - логика кнопки "Готово" при выборе нескольких опций
   * 3. Генерация обработчиков для различных типов целевых узлов (message, sticker, voice, etc.)
   * 4. Поддержка условных сообщений на основе данных пользователя
   * 5. Обра��отка прикрепленных медиа и разл��чных типов контента
   * 6. Управление состоянием ожидания пользовательского ввода
   * 7. Обработка специальных медиа-узлов (стикеры, голос, анимации, локация, контакты)
   * 8. Обработка узлов пол��зовательског�� в��ода �� ��алидацией
   * 9. Обработка start узлов - начальны�� сообщения
   * 10. Обработ����������а command узлов - выполнение ком��нд
   * 11. Универсальный обработчик для остальных типов узлов
   * 12. Fallback обработка кнопок без настроенной цели
   * 13. Обработка кнопок с действием 'command' - создание обработчиков для выполнения команд
   */
  function processNodeButtonsAndGenerateHandlers(processedCallbacks: Set<string>) {
    code = newprocessNodeButtonsAndGenerateHandlers(inlineNodes, processedCallbacks, nodes, code, allNodeIds, connections, mediaVariablesMap);
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
export { generateRequirementsTxt, generateDockerfile, generateReadme, generateConfigYaml };
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






