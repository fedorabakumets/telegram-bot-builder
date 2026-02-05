// Внешние зависимости
import { z } from 'zod';
import { BotData, Node, BotGroup, buttonSchema } from '@shared/schema';

// Внутренние модули - использование экспорта бочек
import { generateBotFatherCommands } from './commands';
import { generateSynonymHandlers } from './Synonyms';
import { generateConditionalButtonHandlerCode, hasConditionalValueButtons } from './Conditional/conditional-button-handler';
import { generateHideAfterClickMiddleware } from './generate/generateHideAfterClickHandler';
import {
  toPythonBoolean,
  generateWaitingStateCode,
  extractNodesAndConnections,
  generateAttachedMediaSendCode,
  formatTextForPython,
  stripHtmlTags,
  generateUniqueShortId,
  escapeForJsonString,
  calculateOptimalColumns,
  generateButtonText
} from './format';
import { generateConditionalMessageLogic } from './Conditional';
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
    if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0 || allConditionalButtons.size > 0) {
      // Комментарий "Обработчики inline кнопок" только если действительно есть inline кнопки
      if (inlineNodes.length > 0 || allConditionalButtons.size > 0) {
        code += '\n# Обработчики inline кнопок\n';
      } else {
        // Для автопереходов используем специальный комментарий
        code += '\n# Обработчики автопереходов\n';
      }
      const processedCallbacks = new Set<string>();

      // Пропускаем обработчики условных заполнителей - они конфликтуют с основными обработчиками
      // Основные обработчики обратного вызова ниже будут правильно обрабатывать все взаимодействия с кнопками
      // Затем обрабатываем узла inline кнопок - создаем обработчики для каждого уникального идентификатора кнопки
      processNodeButtonsAndGenerateHandlers(processedCallbacks);

      // ============================================================================
      // СПЕЦИАЛЬНАЯ ОБРАБОТКА УЗЛА interests_result
      // ============================================================================
      // Этот узел требует особой обработки из-за интеграции с метро-клавиатурой
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Убедиться, что interests_result получает обработчик, НО избегать дубликатов
      if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР CRITICAL FIX: Проверяем interests_result обработяик');
      if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРяТОР: processedCallbacks перед check:', Array.from(processedCallbacks));

      // Проверяем, был ли interests_result уже обработан в основном цикле
      const wasInterestsResultProcessed = processedCallbacks.has('interests_result');
      if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле?', wasInterestsResultProcessed);

      // ИСПРАВЛЕНИЕ: НЕ создаем дублирующий обработчик если он уже есть
      if (wasInterestsResultProcessed) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: ПРОПУСКАЕМ создание дублирующего обработчика для interests_result');
        if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле, избегаем конфликта клавиатур');
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: Создаем обработчик для interests_result (не найден в основном цикле)');
        processedCallbacks.add('interests_result');
        const interestsResultNode = nodes.find(n => n.id === 'interests_result');
        if (interestsResultNode) {
          processedCallbacks.add('interests_result');
          code += `\n@dp.callback_query(lambda c: c.data == "interests_result" or c.data.startswith("interests_result_btn_"))\n`;
          code += `async def handle_callback_interests_result(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += '    # Handle interests_result node\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    # Инициализируем базовые переменные пользователя\n';
          code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
          code += '    \n';

          // Добавляем полную обработку сообщений для узла interests_result
          const messageText = interestsResultNode.data.messageText || "Результат";
          const cleanedMessageText = stripHtmlTags(messageText);
          const formattedText = formatTextForPython(cleanedMessageText);

          code += `    text = ${formattedText}\n`;
          code += '    \n';
          code += generateUniversalVariableReplacement('    ');

          // ИСПРАВЛЕНИЕ: Специальная логика для interests_result - показываем метро клавиатуру
          if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: Обрабатываем interests_result узел - добавляем метро клавиатуру');
          code += '    # ИСПРАВЛЕяИЕ: Проверяем, нужно ли показать метро клавиатуру\n';
          code += '    logging.info("🔧 ГЕНЕРАТОР DEBUG: Вошли в узел interests_result")\n';
          code += '    # Загружаем флаг из базы данных, если он там есть\n';
          code += '    user_vars = await get_user_from_db(user_id)\n';
          code += '    if not user_vars:\n';
          code += '        user_vars = user_data.get(user_id, {})\n';
          code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из user_data")\n';
          code += '    else:\n';
          code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из базы данных")\n';
          code += '    \n';
          code += '    show_metro_keyboard = False\n';
          code += '    if isinstance(user_vars, dict):\n';
          code += '        if "show_metro_keyboard" in user_vars:\n';
          code += '            show_metro_keyboard = str(user_vars["show_metro_keyboard"]).lower() == "true"\n';
          code += '            logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Нашли show_metro_keyboard в user_vars: {show_metro_keyboard}")\n';
          code += '    \n';
          code += '    # Также проверяем локальное хранилище\n';
          code += '    if not show_metro_keyboard:\n';
          code += '        show_metro_keyboard = user_data.get(user_id, {}).get("show_metro_keyboard", False)\n';
          code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Проверили локальное хранилище: {show_metro_keyboard}")\n';
          code += '    \n';
          code += '    saved_metro = user_data.get(user_id, {}).get("saved_metro_selection", [])\n';
          code += '    logging.info(f"🚇 interests_result: show_metro_keyboard={show_metro_keyboard}, saved_metro={saved_metro}")\n';
          code += '    \n';

          // Няходим узел metro_selection дяя восстановления его кнопок
          const metroNode = nodes.find(n => n.id.includes('metro_selection'));
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Поиск узла metro_selection - найден: ${metroNode ? 'да' : 'нет'}`);
          if (metroNode && metroNode.data.buttons) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел metro_selection найден: ${metroNode.id}, кнопок: ${metroNode.data.buttons.length}`);
            code += '    # Создаем метро клавиатуру если нужно\n';
            code += '    if show_metro_keyboard:\n';
            code += '        logging.info("🚇 ПОКАЗЫВАЕМ метро клавиатяру в interests_result")\n';
            code += '        builder = InlineKeyboardBuilder()\n';

            // Добавляем кнопки метро
            metroNode.data.buttons.forEach((btn: Button, index: number) => {
              const shortNodeId = metroNode.id.slice(-10).replace(/^_+/, '');
              const callbackData = `ms_${shortNodeId}_${btn.target || `btn_${index}`}`;
              code += `        # Кнопка метро: ${btn.text}\n`;
              code += `        selected_metro = "${btn.text}" in saved_metro\n`;
              code += `        button_text = "✅ " + "${btn.text}" if selected_metro else "${btn.text}"\n`;
              code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
            });

            // Добавляем кнопку "Готово" с правильным callback_data для handle_multi_select_done
            const metroCallbackData = `multi_select_done_${metroNode.id}`;
            code += `        builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="${metroCallbackData}"))\n`;
            code += '        builder.adjust(2)  # 2 кнопки в ряд\n';
            code += '        metro_keyboard = builder.as_markup()\n';
            code += '        \n';

            // Обычные кнопки interests_result
            code += '        # Добавляем обычные кнопки interests_result\n';
            if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
              code += '        result_builder = InlineKeyboardBuilder()\n';
              interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "goto" && btn.target) {
                  const btnCallbackData = `${btn.target}_btn_${index}`;
                  code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                } else if (btn.action === "command" && btn.target) {
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                } else if (btn.action === "url") {
                  code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                }
              });
              code += '        result_keyboard = result_builder.as_markup()\n';
              code += '        \n';
              code += '        # Объединяем клавиатуры\n';
              code += '        combined_keyboard = InlineKeyboardMarkup(inline_keyboard=metro_keyboard.inline_keyboard + result_keyboard.inline_keyboard)\n';
              code += '        await bot.send_message(user_id, text, reply_markup=combined_keyboard)\n';
            } else {
              code += '        await bot.send_message(user_id, text, reply_markup=metro_keyboard)\n';
            }

            code += '        # НЕ сбрасываем флаг show_metro_keyboard, чтобы клавиатура оставалась активной\n';
            code += '        logging.info("🚇 Клавиатура метро показана и остается активной")\n';
            code += '    else:\n';
            code += '        # Обычная логика без метро клавиатуры\n';

            // Обрабатываем кнопки, если есть (без метро клавиатуры)
            if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
              code += '        builder = InlineKeyboardBuilder()\n';
              interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "goto" && btn.target) {
                  const btnCallbackData = `${btn.target}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                } else if (btn.action === "command" && btn.target) {
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                } else if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                }
              });
              code += '        keyboard = builder.as_markup()\n';
              code += '        await bot.send_message(user_id, text, reply_markup=keyboard)\n';
            } else {
              code += '        await bot.send_message(user_id, text)\n';
            }
          } else {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР: Узел metro_selection НЕ найден или у него нет кнопок');
            // Обычная логика если узла метро нет
            code += '    logging.info("🚇 Узел metro_selection не найден, используем обычную логику")\n';
            if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
              code += '    builder = InlineKeyboardBuilder()\n';
              interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "goto" && btn.target) {
                  const btnCallbackData = `${btn.target}_btn_${index}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                } else if (btn.action === "command" && btn.target) {
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                } else if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
              code += '    await bot.send_message(user_id, text, reply_markup=keyboard)\n';
            } else {
              code += '    await bot.send_message(user_id, text)\n';
            }
          }
          code += '\n';
        }
      }

      // ============================================================================
      // ОСНОВНОЙ ЦИКЛ ГЕНЕРАЦИИ ОБРАБОТЧИКОВ
      // ============================================================================
      // Теперь генерируем обработчики обратного вызова для всех оставшихся ссылочных узлов, которые не имеют inline кнопок
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Обработка allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Уже обработанные callbacks: ${Array.from(processedCallbacks).join(', ')}`);

      allReferencedNodeIds.forEach(nodeId => {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔎 ГЕНЕРАТОР: Проверяем узел ${nodeId}`);
        if (!processedCallbacks.has(nodeId)) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} НЕ был обработан ранее, создаем обработчик`);
          const targetNode = nodes.find(n => n.id === nodeId);
          if (targetNode) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: Найден узел ${nodeId}, тип: ${targetNode.type}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: allowMultipleSelection: ${targetNode.data.allowMultipleSelection}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: keyboardType: ${targetNode.data.keyboardType}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: кнопок: ${targetNode.data.buttons?.length || 0}`);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`📋 ГЕНЕРАТОР: continueButtonTarget: ${targetNode.data.continueButtonTarget || 'нет'}`);

            if (nodeId === 'interests_result') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: СОЗДАЕМ ТРЕТИЙ ОБРАБОТЧИК ДЛЯ interests_result!`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: interests_result данные:`, JSON.stringify(targetNode.data, null, 2));
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: ЭТО МОЖЕТ БЫТЬ ИСТОЧНИКОМ КОНФЛИКТА КЛАВИАТУР!`);
            }

            // ВАЖНО: Не создаваем обработчик для "start", если он уже был создан ранее (избегаем дублирования)
            if (nodeId === 'start') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`Пропускаем создание дублированной функции для узла ${nodeId} - уже создана ранее`);
              return; // Пропускаем создание дублированной функции
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также проверяем interests_result и metro_selection
            if (nodeId === 'interests_result') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для interests_result - уже создан в основном цикле`);
              return; // Избегаем дублирования обработчика interests_result
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пропускаем дублирующий обработчик для metro_selection
            if (nodeId === 'metro_selection') {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для metro_selection - уже создан в основном цикле`);
              return; // Избегаем дублирования обработчика metro_selection
            }

            processedCallbacks.add(nodeId);

            // Создаем обработчик обратного вызова для этого узла, который может обрабатывать несколько кнопок И кнопку "готово" с мультивыбором
            const safeFunctionName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
            const shortNodeIdForDone = nodeId.slice(-10).replace(/^_+/, ''); // Такой же как в генерации кнопки
            code += `\n@dp.callback_query(lambda c: c.data == "${nodeId}" or c.data.startswith("${nodeId}_btn_") or c.data == "done_${shortNodeIdForDone}")\n`;
            code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
            code += '    # Безопасное получение данных из callback_query\n';
            code += '    try:\n';
            code += '        user_id = callback_query.from_user.id\n';
            code += '        callback_data = callback_query.data\n';
            code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
            code += '    except Exception as e:\n';
            code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
            code += '        return\n';
            code += '    \n';
            code += '    # Проверяем флаг hideAfterClick для кнопок\n';
            code += `    ${generateHideAfterClickMiddleware(targetNode)}\n`;
            code += '    \n';
            code += '    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)\n';
            code += '    try:\n';
            code += '        await callback_query.answer()\n';
            code += '    except Exception:\n';
            code += '        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)\n';
            code += '    \n';
            code += '    # Инициализируем базовые переменные пользователя\n';
            code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
            code += '    \n';

            // Устанавливаем флаг collectUserInput для текущего узла
            const collectUserInputFlag = targetNode.data.collectUserInput === true ||
              targetNode.data.enableTextInput === true ||
              targetNode.data.enablePhotoInput === true ||
              targetNode.data.enableVideoInput === true ||
              targetNode.data.enableAudioInput === true ||
              targetNode.data.enableDocumentInput === true;
            code += `    # Устанавливаем флаг collectUserInput для узла ${nodeId}\n`;
            code += `    if user_id not in user_data:\n`;
            code += '        user_data[user_id] = {}\n';
            code += `    user_data[user_id]["collectUserInput_${nodeId}"] = ${toPythonBoolean(collectUserInputFlag)}\n`;
            code += `    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла ${nodeId}: ${collectUserInputFlag}")\n`;
            code += '    \n';

            // ============================================================================
            // ОБРАБОТКА МНОЖЕСТВЕННОГО ВЫБОРА
            // ============================================================================
            // Добавляем обработку кнопки "Готово" для множественного выбора
            if (targetNode.data.allowMultipleSelection) {
              code += '    # Проверяем, является ли это кнопкой "Готово"\n';
              code += `    if callback_data == "done_${shortNodeIdForDone}":\n`;
              code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
              code += '        \n';

              // Сохраняем выбранные значения в базу данных
              const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
              code += '        # Сохраняем выбранные значения в базу данных\n';
              code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${nodeId}", [])\n`;
              code += '        if selected_options:\n';
              code += '            selected_text = ", ".join(selected_options)\n';
              code += `            \n`;
              code += `            # Универсальная логика аккумуляции для всех множественных выборов\n`;
              code += `            # Загружаем существующие значения\n`;
              code += `            existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
              code += `            existing_selections = []\n`;
              code += `            if existing_data and existing_data.strip():\n`;
              code += `                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
              code += `            \n`;
              code += `            # Объединяем существующие и новые выборы (убираем дубли)\n`;
              code += `            all_selections = list(set(existing_selections + selected_options))\n`;
              code += `            final_text = ", ".join(all_selections)\n`;
              code += `            await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
              code += `            logging.info(f"✅ Аккумялировано в переменную ${multiSelectVariable}: {final_text}")\n`;
              code += '        \n';

              // Очищаем состояние множественного выбора
              code += '        # Очищаем состояние множественного выбора\n';
              code += '        if user_id in user_data:\n';
              code += `            user_data[user_id].pop("multi_select_${nodeId}", None)\n`;
              code += '            user_data[user_id].pop("multi_select_node", None)\n';
              code += '            user_data[user_id].pop("multi_select_type", None)\n';
              code += '            user_data[user_id].pop("multi_select_variable", None)\n';
              code += '        \n';

              // Переход к следующему узлу
              if (targetNode.data.continueButtonTarget) {
                const nextNodeId = targetNode.data.continueButtonTarget;
                code += '        # Переход к следующему узлу\n';
                code += `        next_node_id = "${nextNodeId}"\n`;
                code += '        try:\n';
                code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
                code += '        except Exception as e:\n';
                code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
                code += `            await callback_query.message.edit_text("Переход завершен")\n`;
              } else {
                code += '        # Завершение множественного выбора\n';
                code += `        await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
              }
              code += '        return\n';
              code += '    \n';
            }

            // Обычная обработка узлов без специальной логики
            // Определяем переменную для сохранения на основе родительского узла
            if (targetNode && targetNode.data.inputVariable) {
              const variableName = targetNode.data.inputVariable;
              const variableValue = 'callback_query.data';

              // Проверяем, был ли переход через кнопку с skipDataCollection
              // Если была установлена метка skipDataCollectionTransition, не сохраняем переменную
              code += '    # Проверяем, был ли переход через кнопку с skipDataCollection\n';
              code += '    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)\n';
              code += '    if not skip_transition_flag:\n';
              code += `        await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
              code += `        logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
              code += '    else:\n';
              code += '        # Сбрасываем флаг\n';
              code += '        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:\n';
              code += '            del user_data[user_id]["skipDataCollectionTransition"]\n';
              code += '        logging.info(f"Переход через skipDataCollection, переменная ' + variableName + ' не сохраняется (пользователь {user_id})")\n';
              code += '    \n';
            }

            code += `    # Обрабатываем узел ${nodeId}: ${nodeId}\n`;
            const messageText = targetNode.data.messageText || "Сообщение не задано";
            const formattedText = formatTextForPython(messageText);
            code += `    text = ${formattedText}\n`;
            code += '    \n';
            code += generateUniversalVariableReplacement('    ');

            // ============================================================================
            // ОБРАБОТКА УСЛОВНЫХ СООБЩЕНИЙ
            // ============================================================================
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем поддержку условных сообщений
            if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
              code += '    \n';
              code += '    # Проверка условных сообщений дляя навигации\n';
              code += '    conditional_parse_mode = None\n';
              code += '    conditional_keyboard = None\n';
              code += '    user_record = await get_user_from_db(user_id)\n';
              code += '    if not user_record:\n';
              code += '        user_record = user_data.get(user_id, {})\n';
              code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
              code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
              code += '    \n';
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, есть ли условная клавиатура
            // Не оборачиваем код в if - вместо ятого просто используем условную клавиатуру при отправке
            // ИСПРАВЛЕНИЕ: Добавляем специальную обработку для узлов с множественным выбором
            // ============================================================================
            // ГЕНЕРАЦИЯ КЛАВИАТУР (INLINE/REPLY)
            // ============================================================================
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Все узла с кнопками selection обрабатываются как множественный выбор
            const hasSelectionButtons = targetNode.data.buttons && targetNode.data.buttons.some((btn: { action: string; }) => btn.action === 'selection');
            if (targetNode.data.allowMultipleSelection || hasSelectionButtons) {
              // Узел с множественным выбором - создаем специальную клавиатуру
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ========================================`);
              const reason = hasSelectionButtons ? 'ИМЕЕТ КНОПКИ SELECTION' : 'ИМЕЕТ allowMultipleSelection=true';
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: УЗЕЛ ${nodeId} ${reason}`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ЭТО ПРАВИЛЬяЫЙ ПУТЬ ВЫПОЛНЕНИЯ!`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔘 ГЕНЕРАТОР: Кнопки узла ${nodeId}:`, targetNode.data.buttons?.map((b: { text: any; action: any; }) => `${b.text} (action: ${b.action})`)?.join(', ') || 'НЕТ КНОПОК');
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget для ${nodeId}: ${targetNode.data.continueButtonTarget}`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: multiSelectVariable для ${nodeId}: ${targetNode.data.multiSelectVariable}`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons: ${hasSelectionButtons}`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🎯 ГЕНЕРАТОР: ========================================`);

              // Добавляем логику инициализации множественного выбора
              const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
              const multiSelectKeyboardType = targetNode.data.keyboardType || 'reply';

              code += '    # Инициализация состояния множественного выбора\n';
              code += '    if user_id not in user_data:\n';
              code += '        user_data[user_id] = {}\n';
              code += '    \n';
              code += '    # Загружаем ранее выбранные варианты\n';
              code += '    saved_selections = []\n';
              code += '    if user_vars:\n';
              code += `        for var_name, var_data in user_vars.items():\n`;
              code += `            if var_name == "${multiSelectVariable}":\n`;
              code += '                if isinstance(var_data, dict) and "value" in var_data:\n';
              code += '                    selections_str = var_data["value"]\n';
              code += '                elif isinstance(var_data, str):\n';
              code += '                    selections_str = var_data\n';
              code += '                else:\n';
              code += '                    continue\n';
              code += '                if selections_str and selections_str.strip():\n';
              code += '                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n';
              code += '                    break\n';
              code += '    \n';
              code += '    # Инициализируем состояние если его нет\n';
              code += `    if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
              code += `        user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
              code += `    user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
              code += `    user_data[user_id]["multi_select_type"] = "${multiSelectKeyboardType}"\n`;
              code += `    user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
              code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n';
              code += '    \n';

              // ИСПРАВЛЕНИЕ: Проверяем тип клавиатуры и генерируем соответствующий код
              if (multiSelectKeyboardType === 'reply') {
                // Reply клавиатура для множественного выбора
                code += '    # Создаем reply клавиатуру с поддержкой множественного выбора\n';
                code += '    builder = ReplyKeyboardBuilder()\n';

                // Разделяем кнопки на опции выбора и обычные кнопки
                let buttonsToUse = targetNode.data.buttons || [];
                const selectionButtons = buttonsToUse.filter((button: { action: string; }) => button.action === 'selection');
                const regularButtons = buttonsToUse.filter((button: { action: string; }) => button.action !== 'selection');

                // Добавляем кнопки выбора с отметками о состоянии
                selectionButtons.forEach((button: { text: any; }, index: number) => {
                  code += `    # Кнопка выбора ${index + 1}: ${button.text}\n`;
                  code += `    selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
                  code += `    builder.add(KeyboardButton(text=f"{selected_mark}${button.text}"))\n`;
                });

                // Добавляем кнопку "Готово"
                if (selectionButtons.length > 0) {
                  const continueText = targetNode.data.continueButtonText || 'Готово';
                  code += `    builder.add(KeyboardButton(text="${continueText}"))\n`;
                }

                // Добавляем обычные кнопки
                regularButtons.forEach((btn: Button) => {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                });

                const resizeKeyboard = targetNode.data.resizeKeyboard !== false;
                const oneTimeKeyboard = targetNode.data.oneTimeKeyboard === true;
                code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              } else {
                // Inline клавиатура для множественного выбора
                code += '    # Создаем inline клавиатуру с поддержкой множественного выбора\n';
                code += '    builder = InlineKeyboardBuilder()\n';

                // Разделяем кнопки на опции выбора и обычные кнопки
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: targetNode.data.buttons:`, targetNode.data.buttons);

                let buttonsToUse = targetNode.data.buttons || [];

                const selectionButtons = buttonsToUse.filter((button: { action: string; }) => button.action === 'selection');
                const regularButtons = buttonsToUse.filter((button: { action: string; }) => button.action !== 'selection');
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Найдено ${selectionButtons.length} кнопок выбора и ${regularButtons.length} обычных кнопок`);

                // Добавляем кнопки выбора с отметками о состоянии
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Создаем ${selectionButtons.length} кнопок выбора для узла ${nodeId}`);
                selectionButtons.forEach((button: { target: any; id: any; text: any; }, index: number) => {
                  // Используем короткие callback_data
                  const shortNodeId = generateUniqueShortId(nodeId, allNodeIds || []); // Используем новую функцию
                  const shortTarget = (button.target || button.id || 'btn').slice(-8);
                  const callbackData = `ms_${shortNodeId}_${shortTarget}`;
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);
                  code += `    # Кнопка выбора ${index + 1}: ${button.text}\n`;
                  code += `    logging.info(f"🔘 Создаем кнопку: ${button.text} -> ${callbackData}")\n`;
                  code += `    selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
                  code += `    builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))\n`;
                });

                // Добавляем кнопку "Готово" для множественного выбора
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: НАЧИНАЕМ создание кнопки "Готово" для узла ${nodeId}`);
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: allowMultipleSelection = ${targetNode.data.allowMultipleSelection}`);
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${targetNode.data.continueButtonTarget}`);
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: selectionButtons.length = ${selectionButtons.length}`);

                // ВСЕГДА добавляем кнопку "Готово" если есть кнопки выбора
                if (selectionButtons.length > 0) {
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "Готово" (есть ${selectionButtons.length} кнопок выбора)`);
                  code += '    # Кнопка "Готово" для множественного выбора\n';
                  const shortNodeIdDone = nodeId.slice(-10).replace(/^_+/, ''); // Убираем ведущие underscores
                  const doneCallbackData = `done_${shortNodeIdDone}`;
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Кнопка "Готово" -> ${doneCallbackData} (длина: ${doneCallbackData.length})`);
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ГЕНЕРИРУЕМ код кнопки "Готово"!`);

                  code += `    logging.info(f"🔘 Создаем кнопку Готово -> ${doneCallbackData}")\n`;
                  code += `    builder.add(InlineKeyboardButton(text="Готово", callback_data="${doneCallbackData}"))\n`;

                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ УСПЕШНО добавили кнопку "Готово" в код генерации`);
                } else {
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем кнопку "Готово" - нет кнопок выбора`);
                }

                // Добавляем обычные кнопки (navigation и другие)
                regularButtons.forEach((btn: Button, index: number) => {
                  if (btn.action === "goto" && btn.target) {
                    const btnCallbackData = `${btn.target}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                  } else if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === "command" && btn.target) {
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });

                // Автоматическое распределение колонок для множественного выбора
                const totalButtons = selectionButtons.length + (targetNode.data.continueButtonTarget ? 1 : 0) + regularButtons.length;
                // Для множественного выбора всегда используем nodeData с включенным флагом
                const multiSelectNodeData = { ...targetNode.data, allowMultipleSelection: true };
                // Создаем массив с нужным количеством элементов для расчета колонок
                const allButtonsForCalculation = Array(totalButtons).fill({});
                const columns = calculateOptimalColumns(allButtonsForCalculation, multiSelectNodeData);
                code += `    builder.adjust(${columns})\n`;
                code += '    keyboard = builder.as_markup()\n';
              }

            } else if (targetNode.data.keyboardType !== 'none' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              // Обычные кнопки без множественного выбора
              // ИСПРАВЛЕНИЕ: Проверяем keyboardType узла и генерируем соответствующую клавиатуру
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ генерируем клавиатуру если keyboardType === 'none'
              if (targetNode.data.keyboardType === 'reply') {
                // Генерируем reply клавиатуру
                code += '    # Create reply keyboard\n';

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли уже создана условная клавиатура
                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  // Инициализируем переменную conditional_keyboard, если она не была определена
                  code += '    if "conditional_keyboard" not in locals():\n';
                  code += '        conditional_keyboard = None\n';
                  code += '    # Проверяем, есть ли условная клавиатура\n';
                  code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
                  code += '        keyboard = conditional_keyboard\n';
                  code += '        logging.info("✅ Используем уяловную reply клавиатуру")\n';
                  code += '    else:\n';
                  code += '        # Условная клавиатура не создана, используем обычную\n';
                  code += '        builder = ReplyKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button) => {
                    if (btn.action === "contact" && btn.requestContact) {
                      code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                    } else if (btn.action === "location" && btn.requestLocation) {
                      code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                    } else {
                      code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    }
                  });
                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  code += '        logging.info("✅ Используем обычную reply клавиатуру")\n';
                } else {
                  // Нет условных сообщений, просто создаем обычную клавиатуру
                  code += '    # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
                  code += '    builder = ReplyKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button) => {
                    if (btn.action === "contact" && btn.requestContact) {
                      code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                    } else if (btn.action === "location" && btn.requestLocation) {
                      code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                    } else {
                      code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    }
                  });
                  const resizeKeyboard2 = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard2 = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard2}, one_time_keyboard=${oneTimeKeyboard2})\n`;
                }
                code += '    # Для reply клавиатуры нужно отправить новое сообщение\n';
                code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';

                // Проверяем автопереход для reply клавиатуры
                const currentNodeForReplyAutoTransition = nodes.find(n => n.id === nodeId);
                let replyAutoTransitionTarget: string | null = null;
                if (currentNodeForReplyAutoTransition?.data.enableAutoTransition && currentNodeForReplyAutoTransition?.data.autoTransitionTo) {
                  replyAutoTransitionTarget = currentNodeForReplyAutoTransition.data.autoTransitionTo;
                } else if (currentNodeForReplyAutoTransition && (!currentNodeForReplyAutoTransition.data.buttons || currentNodeForReplyAutoTransition.data.buttons.length === 0)) {
                  const outgoingConnections = connections.filter(conn => conn.source === nodeId);
                  if (outgoingConnections.length === 1) {
                    replyAutoTransitionTarget = outgoingConnections[0].target;
                  }
                }

                if (replyAutoTransitionTarget) {
                  const safeFunctionName = replyAutoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
                  code += '    \n';
                  code += '    # АВТОПЕРЕХОД после reply клавиатуры\n';
                  code += `    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${replyAutoTransitionTarget}")\n`;
                  code += `    await handle_callback_${safeFunctionName}(callback_query)\n`;
                  code += `    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${replyAutoTransitionTarget}")\n`;
                }

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Настраиваем waiting_for_input яяля targetNode ТОЛЬКяя если collectUserInput=true
                const targetCollectInputReply = targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true;

                if (targetCollectInputReply) {
                  const targetInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                  const targetSaveToDb = targetNode.data.saveToDatabase !== false;

                  code += '    \n';
                  code += '    # Настройка waiting_for_input для узла с reply клавиатурой (collectUserInput=true)\n';
                  code += '    user_id = callback_query.from_user.id\n';
                  code += '    if user_id not in user_data:\n';
                  code += '        user_data[user_id] = {}\n';

                  // Определяем modes для ввода
                  const modes: string[] = [];
                  if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons?.length > 0) {
                    modes.push('button');
                  }
                  if (targetNode.data.enableTextInput !== false) {
                    modes.push('text');
                  }
                  if (targetNode.data.enablePhotoInput) modes.push('photo');
                  if (targetNode.data.enableVideoInput) modes.push('video');
                  if (targetNode.data.enableAudioInput) modes.push('audio');
                  if (targetNode.data.enableDocumentInput) modes.push('document');

                  const modesStr = modes.length > 0 ? modes.map(m => `'${m}'`).join(', ') : "'button', 'text'";

                  // Собираем кнопки с skipDataCollection для reply клавиатуры
                  const skipButtons = (targetNode.data.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                  const skipButtonsJson = JSON.stringify(skipButtons);

                  code += `    user_data[user_id]["waiting_for_input"] = {\n`;
                  code += `        "type": "button",\n`;
                  code += `        "modes": [${modesStr}],\n`;
                  code += `        "variable": "${targetInputVariable}",\n`;
                  code += `        "save_to_database": ${targetSaveToDb ? 'True' : 'False'},\n`;
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "next_node_id": "",\n`;
                  code += `        "skip_buttons": ${skipButtonsJson}\n`;
                  code += `    }\n`;
                  code += `    logging.info(f"✅ Состояние ожидания настроено: modes=[${modesStr}] для переменной ${targetInputVariable} (узел ${targetNode.id})")\n`;
                } else {
                  code += '    \n';
                  code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                  code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                }

                code += '    return  # Возвращаемся чтобы не отправить сообщение дважды\n';
              } else {
                // Генерируем inline клавиатуру (по умолчанию)
                code += '    # Create inline keyboard\n';
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "goto" && btn.target) {
                    const btnCallbackData = `${btn.target}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                  } else if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === "command" && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  } else if (btn.action === "selection") {
                    // Добавляем поддержку кнопок выбора для обычных узлов
                    const callbackData = `multi_select_${nodeId}_${btn.target || btn.id}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += '    keyboard = builder.as_markup()\n';
              }
            } else {
              code += '    keyboard = None\n';
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем условную клавиатуру и используем её если есть
            code += '    \n';
            code += '    # Проверяем, есть ли условная клавиатура для использования\n';
            code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
            code += '    if "conditional_keyboard" not in locals():\n';
            code += '        conditional_keyboard = None\n';
            code += '    user_id = callback_query.from_user.id\n';
            code += '    if user_id not in user_data:\n';
            code += '        user_data[user_id] = {}\n';
            code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
            code += '        keyboard = conditional_keyboard\n';
            code += '        user_data[user_id]["_has_conditional_keyboard"] = True\n';
            code += '        logging.info("✅ Используем условную клавиатуру для навигации")\n';
            code += '    else:\n';
            code += '        user_data[user_id]["_has_conditional_keyboard"] = False\n';
            code += '    \n';

            // ============================================================================
            // ОБРАБОТКА МЕДИА-КОНТЕНТА
            // ============================================================================
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем переменную изображения для узла
            if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '') {
              code += '    # Устанавливаем переменную изображения для узла\n';
              code += '    user_id = callback_query.from_user.id\n';
              code += '    if user_id not in user_data:\n';
              code += '        user_data[user_id] = {}\n';
              code += `    user_data[user_id]["image_url_${nodeId}"] = "${targetNode.data.imageUrl}"\n`;
              if (userDatabaseEnabled) {
                code += `    await update_user_data_in_db(user_id, "image_url_${nodeId}", "${targetNode.data.imageUrl}")\n`;
              }
              code += `    logging.info(f"✅ Переменная image_url_${nodeId} установлена: ${targetNode.data.imageUrl}")\n`;
              code += '    \n';
            }

            // ИСПРАВЛЕНИЕ: Проверяем наличие прикрепленных медиа ИЛИ статического изображения перед отправкой
            const attachedMedia = targetNode.data.attachedMedia || [];
            const hasStaticImage = targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '';

            if (attachedMedia.length > 0 || hasStaticImage) {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} имеет attachedMedia:`, attachedMedia, 'или статическое изображение:', hasStaticImage);
              // Генерируем код отправки с медиа
              const parseModeStr = targetNode.data.formatMode || '';
              const keyboardStr = 'keyboard if keyboard is not None else None';
              // Определяем, собирает ли узел ввод (учитываем все типы ввода)
              const collectUserInputFlag = targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true;
              const mediaCode = generateAttachedMediaSendCode(
                attachedMedia,
                mediaVariablesMap,
                'text',
                parseModeStr,
                keyboardStr,
                nodeId,
                '    ',
                undefined, // автопереход обрабатывается отдельно ниже
                collectUserInputFlag,
                targetNode.data // передаем данные узла для проверки статических изображений
              );

              if (mediaCode) {
                code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
                code += mediaCode;
              } else {
                // Резервный вариант если не удалось сгенерировать код медиа
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Не удалось сгенерировать код медиа для узла ${nodeId}, используем обычную отправку`);
                code += '    # Отправляем сообщение\n';
                code += '    try:\n';
                code += '        if keyboard:\n';
                code += '            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n';
                code += '        else:\n';
                code += '            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)\n';
                code += '            await callback_query.message.answer(text)\n';
                code += '    except Exception as e:\n';
                code += '        logging.debug(f"Ошибка отправки сообщения: {e}")\n';
                code += '        if keyboard:\n';
                code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
                code += '        else:\n';
                code += '            await callback_query.message.answer(text)\n';
                code += '    \n';
              }
            } else {
              // Обычное сообщение без медиа
              // Отправляем сообщение с клавиатурой
              code += '    # Отправляем сообщение\n';
              code += '    try:\n';
              code += '        if keyboard:\n';
              code += '            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)\n';
              code += '            await callback_query.message.answer(text)\n';
              code += '    except Exception as e:\n';
              code += '        logging.debug(f"Ошибка отправки сообщения: {e}")\n';
              code += '        if keyboard:\n';
              code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await callback_query.message.answer(text)\n';
              code += '    \n';
            }

            // ============================================================================
            // СИСТЕМА АВТОПЕРЕХОДОВ
            // ============================================================================
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем автопереход сразу после отправки сообщения
            const currentNodeForAutoTransition = nodes.find(n => n.id === nodeId);

            // Для узлов без кнопок проверяем автопереход либо по флагу enableAutoTransition, либо по единственному соединению
            let autoTransitionTarget: string | null = null;

            // Сначаля проверяем явный автопереход через флаг
            if (currentNodeForAutoTransition?.data.enableAutoTransition && currentNodeForAutoTransition?.data.autoTransitionTo) {
              autoTransitionTarget = currentNodeForAutoTransition.data.autoTransitionTo;
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} имеет явный автопереход к ${autoTransitionTarget}`);
            }

            // Если узел не имеет кнопок и имеет ровно одно исходящее соединение, делаем автопереход
            else if (currentNodeForAutoTransition && (!currentNodeForAutoTransition.data.buttons || currentNodeForAutoTransition.data.buttons.length === 0)) {
              const outgoingConnections = connections.filter(conn => conn.source === nodeId);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔍 ГЕНЕРАТОР: Узел ${nodeId} без кнопок, проверяем соединения: ${outgoingConnections.length}`);
              if (outgoingConnections.length === 1) {
                autoTransitionTarget = outgoingConnections[0].target;
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔗 ГЕНЕРАТОР: Узел ${nodeId} без кнопок имеет одно соединение к ${autoTransitionTarget}, делаем автопереход`);
              }
            }

            if (autoTransitionTarget) {
              const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР АВТОПЕРЕХОД: Добавляем кяд автоперехода для узла ${nodeId} -> ${autoTransitionTarget}`);
              code += '    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла\n';
              code += '    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура\n';
              code += '    user_id = callback_query.from_user.id\n';
              code += '    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n';
              code += '    if has_conditional_keyboard:\n';
              code += '        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")\n';
              code += '    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
              code += `        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${nodeId}")\n`;
              code += '    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)\n';
              code += `    elif user_id in user_data and user_data[user_id].get("collectUserInput_${nodeId}", True) == True:\n`;
              code += `        logging.info(f"ℹ️ Узел ${nodeId} ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")\n`;
              // Добавляем статическую проверку collectUserInput как резервную
              const staticCollectUserInput = targetNode.data.collectUserInput === true ||
                targetNode.data.enableTextInput === true ||
                targetNode.data.enablePhotoInput === true ||
                targetNode.data.enableVideoInput === true ||
                targetNode.data.enableAudioInput === true ||
                targetNode.data.enableDocumentInput === true;
              if (staticCollectUserInput) {
                code += `    elif True:  # Узел ожидает ввод (статическая проверка)\n`;
                code += `        logging.info(f"ℹ️ Узел ${nodeId} ожидает ввод (collectUserInput=true из статической проверки), автопереход пропущен")\n`;
              }
              code += '    else:\n';
              code += `        # ⚡ Автопереход к узлу ${autoTransitionTarget}\n`;
              code += `        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTarget}")\n`;
              code += `        await handle_callback_${safeFunctionName}(callback_query)\n`;
              code += `        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTarget}")\n`;
              code += `        return\n`;
              code += '    \n';
            }

            // ИСПРАВЛЕНИЕ: Если автопереход не произошел, устанавливаем состояние ожидания
            const collectInputAfterTransitionCheck = targetNode.data.collectUserInput !== false ||
              targetNode.data.enableTextInput === true ||
              targetNode.data.enablePhotoInput === true ||
              targetNode.data.enableVideoInput === true ||
              targetNode.data.enableAudioInput === true ||
              targetNode.data.enableDocumentInput === true;

            if (collectInputAfterTransitionCheck) {
              code += '    # Устанавливаем waiting_for_input, так как автопереход не выполнен\n';
              code += generateWaitingStateCode(targetNode, '    ', 'user_id');
            }

            // ============================================================================
            // СОХРАНЕНИЕ ДАННЫХ И НАВИГАЦИЯ
            // ============================================================================
            // Сохраняем нажатие кнопки в базу данных ТОЛЬКО если это реальнаяя кнопка
            code += '    user_id = callback_query.from_user.id\n';
            code += '    \n';

            // Генерируем код для поиска яттекста кнопки
            const sourceNode = nodes.find(n => n.data.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId)
            );

            // Если к узлу ведут несколько кнопоя, нужно определить, какую именяо нажали
            let buttonsToTargetNode = [];
            if (sourceNode) {
              buttonsToTargetNode = sourceNode.data.buttons.filter((btn: { target: string; }) => btn.target === nodeId);
            }

            // Сохраняем button_click ТОЛЬКО если есть sourceNode (реальнаяя кнопка, а не автопереход)
            if (sourceNode) {
              code += '    # Сохраняем нажатие кнопки в базу данных\n';
              code += '    # Ищем текят кнопки по callback_data\n';

              if (buttonsToTargetNode.length > 1) {
                // Несколько кнопяк ведут к одному узлу - создяем логику определения по callback_data
                code += `    # Определяем тякст кнопки по callback_data\n`;
                code += `    button_display_text = "Неизвестная кнопка"\n`;
                buttonsToTargetNode.forEach((button: Button, index: number) => {
                  // Проверяем по суффиксу _btn_index в callback_data
                  code += `    if callback_query.data.endswith("_btn_${index}"):\n`;
                  code += `        button_display_text = "${button.text}"\n`;
                });

                // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем кнопку по точному соответствию callback_data с nodeId
                code += `    # Дополнительная проверка по точному соответствию callback_data\n`;
                buttonsToTargetNode.forEach((button: Button) => {
                  code += `    if callback_query.data == "${nodeId}":\n`;
                  // Для случая когда несколько кнопок вядут к одному узлу, используем первую найденную
                  code += `        button_display_text = "${button.text}"\n`;
                });
              } else {
                const button = sourceNode.data.buttons.find((btn: Button) => btn.target === nodeId);
                if (button) {
                  code += `    button_display_text = "${button.text}"\n`;
                } else {
                  code += `    button_display_text = "Кнопка ${nodeId}"\n`;
                }
              }
              code += '    \n';
              code += '    # Сохраняем ответ в базу данных\n';

              code += '    timestamp = get_moscow_time()\n';
              code += '    \n';
              code += '    response_data = button_display_text  # Простое значение\n';
              code += '    \n';
              code += '    # Сохраняем в пользовательские данные\n';
              code += '    if user_id not in user_data:\n';
              code += '        user_data[user_id] = {}\n';
              code += '    user_data[user_id]["button_click"] = button_display_text\n';
            }

            // Определяем переменную для сохяанения на основе кнопки (ТОЛЬКО есяи есть sourceNode)
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ сохраняем переменную если показана условная клавиатура
            // Нужно дождаться, пока пользователь нажмёт кнопку на условной клавиатуре
            if (sourceNode) {
              code += '    \n';
              code += '    # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли показана условная клавиатура\n';
              code += '    # Если да - НЕ сохраняем переменную сейчас, ждём выбора пользователя\n';
              code += '    has_conditional_keyboard_for_save = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n';
              code += '    if not has_conditional_keyboard_for_save:\n';

              const parentNode = nodes.find(n => n.data.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId)
              );

              let variableName = 'button_click';
              let variableValue = 'button_display_text';

              // КРИТИЧЕСКИ ВАЖНО: специальная логика для шаблона "Федя"
              if (nodeId === 'source_search') {
                variableName = 'источник';
                variableValue = '"🔍 Поиск в интернете"';
              } else if (nodeId === 'source_friends') {
                variableName = 'источник';
                variableValue = '"👥 Друзья"';
              } else if (nodeId === 'source_ads') {
                variableName = 'источник';
                variableValue = '"📱 Реклама"';
              } else if (parentNode && parentNode.data.inputVariable) {
                variableName = parentNode.data.inputVariable;

                // Ищем конкретную кнопку и её значение
                const button = parentNode.data.buttons.find((btn: { target: string; }) => btn.target === nodeId);
                if (button) {
                  // Определяем значение переменной в зависимости от кнопки
                  if (button.id === 'btn_search' || nodeId === 'source_search') {
                    variableValue = '"из инетя"';
                  } else if (button.id === 'btn_friends' || nodeId === 'source_friends') {
                    variableValue = '"friends"';
                  } else if (button.id === 'btn_ads' || nodeId === 'source_ads') {
                    variableValue = '"ads"';
                  } else if (variableName === 'пол') {
                    // Специальная логика для переменной "пол"
                    if (button.text === 'Мужчина' || button.text === '👨 Мужчина') {
                      variableValue = '"Мужчина"';
                    } else if (button.text === 'Женщина' || button.text === '👩 Женщина') {
                      variableValue = '"Женщина"';
                    } else {
                      variableValue = `"${button.text}"`;
                    }
                  } else {
                    variableValue = 'button_display_text';
                  }
                }
              }

              code += '        # Сохраняем в базу данных с правильным именем переяенной\n';
              code += `        await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
              code += `        logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
              code += '    else:\n';
              code += '        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")\n';
              code += '    \n';
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для узлов с множественным выбором НЕ делаем автоматической переадресации
            const currentNode = nodes.find(n => n.id === nodeId);

            // Для узлов с множественным выбором - НЕ делаем автоматический переход при первичном заходе в узел
            // ИСПРАВЛЕНИЕ: редирект только для узлов с кнопками, чтобы избежать дублирования сообщений при автопереходах
            const hasButtons = currentNode && currentNode.data.buttons && currentNode.data.buttons.length > 0;
            const shouldRedirect = hasButtons && !(currentNode && currentNode.data.allowMultipleSelection);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Узел ${nodeId} hasButtons: ${hasButtons}, allowMultipleSelection: ${currentNode?.data.allowMultipleSelection}, shouldRedirect: ${shouldRedirect}`);

            let redirectTarget = nodeId; // По умолчанию остаемся в том же уяле

            if (shouldRedirect) {
              if (currentNode && currentNode.data.continueButtonTarget) {
                // Для обычных узлов используем continueButtonTarget если есть
                redirectTarget = currentNode.data.continueButtonTarget;
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит к continueButtonTarget ${redirectTarget}`);
              } else {
                // Для обычных узлов ищем следующий узел через соединения
                const nodeConnections = connections.filter(conn => conn.source === nodeId);
                if (nodeConnections.length > 0) {
                  redirectTarget = nodeConnections[0].target;
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит через соединение к ${redirectTarget}`);
                } else {
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} остается в том же узле (нет соединений)`);
                }
              }
            } else {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} без кнопок или с множественным выбором - НЕ делаем автоматическую переадресацию`);
            }

            // ============================================================================
            // СИСТЕМА ПЕРЕАДРЕСАЦИИ
            // ============================================================================
            if (shouldRedirect && redirectTarget && redirectTarget !== nodeId) {
              code += '    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных\n';
              code += `    next_node_id = "${redirectTarget}"\n`;
              code += '    try:\n';
              code += '        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")\n';

              // Добавляем навигацию для каждого узла
              if (nodes.length > 0) {
                nodes.forEach((navTargetNode, index) => {
                  const condition = index === 0 ? 'if' : 'elif';
                  code += `        ${condition} next_node_id == "${navTargetNode.id}":\n`;

                  if (navTargetNode.type === 'message') {
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором вызываем полноценный обработчик
                      const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                      code += `            # Узел с множественным выбором - вызываем полноценный обработчик\n`;
                      code += `            logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
                    } else {
                      // Проверяем, есть ли условные сообщения для этого узла
                      const hasConditionalMessages = navTargetNode.data.enableConditionalMessages &&
                        navTargetNode.data.conditionalMessages &&
                        navTargetNode.data.conditionalMessages.length > 0;

                      if (hasConditionalMessages && navTargetNode.data.collectUserInput === true) {
                        // Для узлов с условными сообщениями вызываем полноценный обработчик
                        const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                        code += `            # Узел с условными сообщениями - вызываем полноценный обработчик\n`;
                        code += `            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: ${navTargetNode.id}")\n`;
                        code += `            await handle_node_${safeFunctionName}(callback_query.message)\n`;
                      } else {
                        const messageText = navTargetNode.data.messageText || 'Сообщение';
                        const formattedText = formatTextForPython(messageText);
                        code += `            nav_text = ${formattedText}\n`;

                        // Добавляем замену переменных в nav_text
                        code += '            # Подставляем переменные пользователя в текст\n';
                        code += '            nav_user_vars = await get_user_from_db(callback_query.from_user.id)\n';
                        code += '            if not nav_user_vars:\n';
                        code += '                nav_user_vars = user_data.get(callback_query.from_user.id, {})\n';
                        code += '            if not isinstance(nav_user_vars, dict):\n';
                        code += '                nav_user_vars = {}\n';
                        code += '            # Заменяем переменные в nav_text\n';
                        code += '            for var_name, var_data in nav_user_vars.items():\n';
                        code += '                placeholder = "{" + var_name + "}"\n';
                        code += '                if placeholder in nav_text:\n';
                        code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
                        code += '                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n';
                        code += '                    elif var_data is not None:\n';
                        code += '                        var_value = str(var_data)\n';
                        code += '                    else:\n';
                        code += '                        var_value = var_name\n';
                        code += '                    nav_text = nav_text.replace(placeholder, var_value)\n';

                        // Проверяем, есть ли прикрепленные медиа
                        const hasAttachedMedia = navTargetNode.data.attachedMedia && navTargetNode.data.attachedMedia.length > 0;

                        if (hasAttachedMedia) {
                          // Генерируем код для отправки медиа
                          const attachedMedia = navTargetNode.data.attachedMedia;
                          code += '            # Проверяем наличие прикрепленного медиа\n';
                          code += `            nav_attached_media = None\n`;
                          code += `            if nav_user_vars and "${attachedMedia[0]}" in nav_user_vars:\n`;
                          code += `                media_data = nav_user_vars["${attachedMedia[0]}"]\n`;
                          code += `                if isinstance(media_data, dict) and "value" in media_data:\n`;
                          code += `                    nav_attached_media = media_data["value"]\n`;
                          code += `                elif isinstance(media_data, str):\n`;
                          code += `                    nav_attached_media = media_data\n`;
                          code += `            if nav_attached_media and str(nav_attached_media).strip():\n`;
                          code += `                logging.info(f"📎 Отправка фото из переменной ${attachedMedia[0]}: {nav_attached_media}")\n`;
                          code += `                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)\n`;
                          code += `            else:\n`;
                          code += `                logging.info("📝 Медиа не найдено, отправка текстового сообщения")\n`;
                          code += `                await callback_query.message.edit_text(nav_text)\n`;
                        } else {
                          // Проверяем, есть ли reply кнопки
                          if (navTargetNode.data.keyboardType === 'reply' && navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                            code += '            # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
                            code += '            builder = ReplyKeyboardBuilder()\n';
                            navTargetNode.data.buttons.forEach((button: Button) => {
                              if (button.action === "contact" && button.requestContact) {
                                code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                              } else if (button.action === "location" && button.requestLocation) {
                                code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                              } else {
                                code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                              }
                            });
                            const resizeKeyboard = toPythonBoolean(navTargetNode.data.resizeKeyboard);
                            const oneTimeKeyboard = toPythonBoolean(navTargetNode.data.oneTimeKeyboard);
                            code += `            keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                            code += '            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)\n';
                          } else {
                            code += '            await callback_query.message.edit_text(nav_text)\n';
                          }
                        }

                        // Если узел message собирает ввод, настраиваем ожидание
                        if (navTargetNode.data.collectUserInput === true) {
                          const inputType = navTargetNode.data.inputType || 'text';
                          // ИСПРАВЛЕНИЕ: Берем inputVariable именно из целевого узла, а не из родительского
                          const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;

                          code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                          code += '            user_id = callback_query.from_user.id\n';
                          code += '            if user_id not in user_data:\n';
                          code += '                user_data[user_id] = {}\n';
                          code += `            # Проверяем, не была ли переменная ${inputVariable} уже сохранена\n`;
                          code += `            if "${inputVariable}" not in user_data[user_id] or not user_data[user_id]["${inputVariable}"]:\n`;
                          code += '                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода\n';
                          code += `                # Тип ввода: ${inputType}\n`;
                          // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
                          code += generateWaitingStateCode(navTargetNode, '                ', 'callback_query.from_user.id').split('\n').map(line => line ? '            ' + line : '').join('\n');
                          code += '            else:\n';
                          code += `                logging.info(f"⏭️ Переменная ${inputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                        }

                        // АВТОПЕРЕХОД: Если у узла есть enableAutoTransition, переходим к следующему узлу
                        if (navTargetNode.data.enableAutoTransition && navTargetNode.data.autoTransitionTo) {
                          const autoTargetId = navTargetNode.data.autoTransitionTo;
                          const safeAutoTargetId = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                          code += '            \n';
                          code += '            # Проверяем, не ждем ли мы ввод перед автопереходом\n';
                          code += '            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
                          code += `                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${navTargetNode.id}")\n`;
                          code += '            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)\n';
                          code += `            elif user_id in user_data and user_data[user_id].get("collectUserInput_${navTargetNode.id}", True) == True:\n`;
                          code += `                logging.info(f"ℹ️ Узел ${navTargetNode.id} ожидает ввод (collectUserInput=true), автопереход пропущен")\n`;
                          code += '            else:\n';
                          code += `                # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                          code += `                logging.info(f"⚡ Автопереход от узла ${navTargetNode.id} к узлу ${autoTargetId}")\n`;
                          code += `                await handle_callback_${safeAutoTargetId}(callback_query)\n`;
                          code += `                logging.info(f"✅ Автопереход выполнен: ${navTargetNode.id} -> ${autoTargetId}")\n`;
                          code += '                return\n';
                        }
                      }
                    }
                  } else if (navTargetNode.type === 'command') {
                    // Для узлов команд вызываем соответствующий обработчик
                    const commandName = navTargetNode.data.command?.replace('/', '') || 'unknown';
                    const handlerName = `${commandName}_handler`;
                    code += `            # Выполняем команду ${navTargetNode.data.command}\n`;
                    code += '            from types import SimpleNamespace\n';
                    code += '            fake_message = SimpleNamespace()\n';
                    code += '            fake_message.from_user = callback_query.from_user\n';
                    code += '            fake_message.chat = callback_query.message.chat\n';
                    code += '            fake_message.date = callback_query.message.date\n';
                    code += '            fake_message.answer = callback_query.message.answer\n';
                    code += `            await ${handlerName}(fake_message)\n`;
                  } else if (navTargetNode.type === 'message' && (navTargetNode.data.enableTextInput ||
                    navTargetNode.data.enablePhotoInput ||
                    navTargetNode.data.enableVideoInput ||
                    navTargetNode.data.enableAudioInput ||
                    navTargetNode.data.enableDocumentInput)) {
                    // Обрабатываем уялы ввода тттекста/медиа с поддержкой условных сообщений
                    const messageText = navTargetNode.data.messageText || 'Введите ваш ответ:';
                    const inputTargetNodeId = navTargetNode.data.inputTargetNodeId || '';

                    // Проверяем, есть ли условные сообщения для этого узла
                    const hasConditionalMessages = navTargetNode.data.enableConditionalMessages &&
                      navTargetNode.data.conditionalMessages &&
                      navTargetNode.data.conditionalMessages.length > 0;

                    if (hasConditionalMessages) {
                      // Если есть условные сообщения, генерируем их обработку
                      code += '            # Узел с условными сообщениями - проверяем условия\n';
                      code += '            user_id = callback_query.from_user.id\n';
                      code += '            user_data_dict = await get_user_from_db(user_id) or {}\n';
                      code += '            user_data_dict.update(user_data.get(user_id, {}))\n\n';

                      // Добавляем определение функции check_user_variable в локальную область видимости
                      code += '            # яункция для проверки переменных пользователя\n';
                      code += '            def check_user_variable(var_name, user_data_dict):\n';
                      code += '                """Проверяет существование я получает значение переменной пользователя"""\n';
                      code += '                # Сначала проверяем в поле user_data (из БД)\n';
                      code += '                if "user_data" in user_data_dict and user_data_dict["user_data"]:\n';
                      code += '                    try:\n';
                      code += '                        import json\n';
                      code += '                        parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n';
                      code += '                        if var_name in parsed_data:\n';
                      code += '                            raw_value = parsed_data[var_name]\n';
                      code += '                            if isinstance(raw_value, dict) and "value" in raw_value:\n';
                      code += '                                var_value = raw_value["value"]\n';
                      code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                      code += '                                if var_value is not None and str(var_value).strip() != "":\n';
                      code += '                                    return True, str(var_value)\n';
                      code += '                            else:\n';
                      code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                      code += '                                if raw_value is not None and str(raw_value).strip() != "":\n';
                      code += '                                    return True, str(raw_value)\n';
                      code += '                    except (json.JSONDecodeError, TypeError):\n';
                      code += '                        pass\n';
                      code += '                \n';
                      code += '                # Проверяем в локальных данных (без вложенности user_data)\n';
                      code += '                if var_name in user_data_dict:\n';
                      code += '                    variable_data = user_data_dict.get(var_name)\n';
                      code += '                    if isinstance(variable_data, dict) and "value" in variable_data:\n';
                      code += '                        var_value = variable_data["value"]\n';
                      code += '                        # Проверяем, что значение действительно существует и не пустое\n';
                      code += '                        if var_value is not None and str(var_value).strip() != "":\n';
                      code += '                            return True, str(var_value)\n';
                      code += '                    elif variable_data is not None and str(variable_data).strip() != "":\n';
                      code += '                        return True, str(variable_data)\n';
                      code += '                \n';
                      code += '                return False, None\n\n';

                      // Генерируем условную логику для этого узла
                      const conditionalMessages = navTargetNode.data.conditionalMessages.sort((a: { priority: any; }, b: { priority: any; }) => (b.priority || 0) - (a.priority || 0));

                      // Создаем единую if/elif/else структуру для всех условий
                      for (let i = 0; i < conditionalMessages.length; i++) {
                        const condition = conditionalMessages[i];
                        const cleanedConditionText = stripHtmlTags(condition.messageText);
                        const conditionText = formatTextForPython(cleanedConditionText);
                        const conditionKeyword = i === 0 ? 'if' : 'elif';

                        // Получаем имена переменных - поддержка как нового формата массива, так и устаревшей единичной переменной
                        const variableNames = condition.variableNames && condition.variableNames.length > 0
                          ? condition.variableNames
                          : (condition.variableName ? [condition.variableName] : []);

                        const logicOperator = condition.logicOperator || 'AND';

                        code += `            # Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;

                        if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                          // Создаем единый блок условия с проверками ВНУТРИ
                          code += `            ${conditionKeyword} (\n`;
                          for (let j = 0; j < variableNames.length; j++) {
                            const varName = variableNames[j];
                            const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                            code += `                check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
                          }
                          code += `            ):\n`;

                          // Внутри блока условия собираем значения переменных
                          code += `                # Собираем значения переменных\n`;
                          code += `                variable_values = {}\n`;
                          for (const varName of variableNames) {
                            code += `                _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
                          }

                          code += `                text = ${conditionText}\n`;

                          // Заменяем переменные в тексте
                          for (const varName of variableNames) {
                            code += `                if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
                            code += `                    text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
                          }

                          // Генерируем клавиатуру для условного сообщения если она есть
                          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, не установлено ли keyboardType="none" на РОДИТЕЛЬСКОМ узле
                          const shouldGenerateKeyboard = navTargetNode.data.keyboardType !== 'none' && condition.keyboardType && condition.keyboardType !== 'none' && condition.buttons && condition.buttons.length > 0;
                          if (shouldGenerateKeyboard) {
                            code += '                # Создаем клавиатуру для у��ловного сообщения\n';

                            if (condition.keyboardType === 'inline') {
                              code += '                builder = InlineKeyboardBuilder()\n';
                              condition.buttons.forEach((button: Button) => {
                                if (button.action === "url") {
                                  code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
                                } else if (button.action === 'goto') {
                                  const callbackData = button.target || button.id || 'no_action';
                                  code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                                } else if (button.action === 'command') {
                                  // Для кнопок команд создаем специальную callback_data
                                  const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                                  code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
                                } else {
                                  const callbackData = button.target || button.id || 'no_action';
                                  code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                                }
                              });
                              code += '                conditional_keyboard = builder.as_markup()\n';
                              code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                            } else if (condition.keyboardType === 'reply') {
                              code += '                builder = ReplyKeyboardBuilder()\n';
                              condition.buttons.forEach((button: Button) => {
                                if (button.action === "contact" && button.requestContact) {
                                  code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                                } else if (button.action === "location" && button.requestLocation) {
                                  code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                                } else {
                                  code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                                }
                              });
                              // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                              const conditionOneTimeKeyboard = toPythonBoolean(condition.oneTimeKeyboard === true);
                              code += `                conditional_keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard})\n`;
                              code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                            }
                          } else {
                            // Нет клавиатуры - отправляем только текст
                            code += '                await bot.send_message(user_id, text)\n';
                          }

                          // Настраиваем ожидание текстового ввода для условного сообщения (если нужно)
                          if (condition.waitForTextInput) {
                            // ИСПРАВЛЕНИЕ: Используем переменную из условия или из целевого узла
                            const conditionalInputVariable = condition.textInputVariable || navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                            code += `                # Настраиваем ожидание текстового ввода для условного сообщения\n`;
                            code += `                user_data[user_id]["waiting_for_input"] = {\n`;
                            code += `                    "type": "text",\n`;
                            code += `                    "variable": "${conditionalInputVariable}",\n`;
                            code += `                    "save_to_database": True,\n`;
                            code += `                    "node_id": "${navTargetNode.id}",\n`;
                            code += `                    "next_node_id": "${condition.nextNodeAfterInput || inputTargetNodeId}"\n`;
                            code += `                }\n`;
                            code += `                logging.info(f"🔧 Настроено условное ожидание ввода для переменной: ${conditionalInputVariable} (узел ${navTargetNode.id})")\n`;
                          }
                        }
                      }

                      // Резервное сообщение
                      code += `            else:\n`;
                      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                      if (navTargetNode.data.allowMultipleSelection === true) {
                        // Для узлов с множественным выбором создаем прямую навигацию
                        const messageText = navTargetNode.data.messageText || 'Сообщение';
                        const formattedText = formatTextForPython(messageText);
                        code += `                # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                        code += `                logging.info(f"🔧 Fallback переход к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                        code += `                text = ${formattedText}\n`;

                        // Замена переменных
                        code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                        code += generateUniversalVariableReplacement('                ');

                        // Инициализируем состояние множественного выбора
                        code += `                # Инициализируем состояние множественного выбора\n`;
                        code += `                user_data[user_id]["multi_select_${navTargetNode.id}"] = []\n`;
                        code += `                user_data[user_id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                        code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
                        if (navTargetNode.data.multiSelectVariable) {
                          code += `                user_data[user_id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                        }

                        // Создаем inline клавиатуру с кнопками выбора
                        if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                          code += generateInlineKeyboardCode(navTargetNode.data.buttons, '                ', navTargetNode.id, navTargetNode.data, allNodeIds);
                          code += `                await bot.send_message(user_id, text, reply_markup=keyboard)\n`;
                        } else {
                          code += `                await bot.send_message(user_id, text)\n`;
                        }
                        code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                      } else {
                        const formattedText = formatTextForPython(messageText);
                        // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                        const fallbackInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                        code += `                # Fallback сообщение\n`;
                        code += `                nav_text = ${formattedText}\n`;
                        // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                        if (navTargetNode.data.collectUserInput === true) {
                          code += `                # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n`;
                          code += `                if "${fallbackInputVariable}" not in user_data[user_id] or not user_data[user_id]["${fallbackInputVariable}"]:\n`;
                          code += `                    # Настраиваем ожидание ввода\n`;
                          code += `                    user_data[user_id]["waiting_for_input"] = {\n`;
                          code += `                        "type": "text",\n`;
                          code += `                        "variable": "${fallbackInputVariable}",\n`;
                          code += `                        "save_to_database": True,\n`;
                          code += `                        "node_id": "${navTargetNode.id}",\n`;
                          code += `                        "next_node_id": "${inputTargetNodeId}"\n`;
                          code += `                    }\n`;
                          code += `                    logging.info(f"🔧 Настроено fallback ожидание ввода для переменной: ${fallbackInputVariable} (узел ${navTargetNode.id})")\n`;
                          code += `                else:\n`;
                          code += `                    logging.info(f"⏭️ Переменная ${fallbackInputVariable} уже сохранена, пропускаем fallback ожидание ввода")\n`;
                        } else {
                          code += `                logging.info(f"Fallback переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                        }
                        code += `                await bot.send_message(user_id, nav_text)\n`;
                      }
                    } else {
                      // Обычный узел без условных сообщений
                      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имяяет ли узел множественный выбор
                      if (navTargetNode.data.allowMultipleSelection === true) {
                        // Для узлов с множественным выбором создаем прямую навигацию
                        const messageText = navTargetNode.data.messageText || 'Сообщение';
                        const formattedText = formatTextForPython(messageText);
                        code += `            # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                        code += `            logging.info(f"🔧 Переходим к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                        code += `            text = ${formattedText}\n`;

                        // Замена переменных
                        code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                        code += generateUniversalVariableReplacement('            ');

                        // Инициализируем состояние множественного выбора
                        code += `            # Инициализируем состояние множественного выбора\n`;
                        code += `            user_data[callback_query.from_user.id]["multi_select_${navTargetNode.id}"] = []\n`;
                        code += `            user_data[callback_query.from_user.id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                        code += `            user_data[callback_query.from_user.id]["multi_select_type"] = "selection"\n`;
                        if (navTargetNode.data.multiSelectVariable) {
                          code += `            user_data[callback_query.from_user.id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                        }

                        // Создаем inline клавиатуру с кнопками выбора
                        if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                          code += generateInlineKeyboardCode(navTargetNode.data.buttons, '            ', navTargetNode.id, navTargetNode.data, allNodeIds);
                          code += `            await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n`;
                        } else {
                          code += `            await bot.send_message(callback_query.from_user.id, text)\n`;
                        }
                        code += `            logging.info(f"✅ яярямая навигация к узлу множественного выбора ${navTargetNode.id} вяяполяяена")\n`;
                      } else {
                        const formattedText = formatTextForPython(messageText);
                        code += `            nav_text = ${formattedText}\n`;

                        // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                        if (navTargetNode.data.collectUserInput === true) {
                          // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                          const regularInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                          code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                          code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                          code += `            if "${regularInputVariable}" not in user_data[callback_query.from_user.id] or not user_data[callback_query.from_user.id]["${regularInputVariable}"]:\n`;
                          code += '                # Настраиваем ожидание ввода\n';
                          code += '                user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                          code += '                    "type": "text",\n';
                          code += `                    "variable": "${regularInputVariable}",\n`;
                          code += '                    "save_to_database": True,\n';
                          code += `                    "node_id": "${navTargetNode.id}",\n`;
                          code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
                          code += '                }\n';
                          code += `                logging.info(f"🔧 Настроено ожидание ввода для переменной: ${regularInputVariable} (узел ${navTargetNode.id})")\n`;
                          code += '            else:\n';
                          code += `                logging.info(f"⏭️ Переменная ${regularInputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                        } else {
                          code += `            logging.info(f"Переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                        }
                        code += '            await bot.send_message(callback_query.from_user.id, nav_text)\n';
                      }
                    }
                  } else {
                    code += `            logging.info("Переход к узлу ${navTargetNode.id}")\n`;
                  }
                });

                code += '        else:\n';
                code += '            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")\n';
              } else {
                code += '        # No nodes available for navigation\n';
                code += '        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")\n';
              code += '    \n';
              code += '    return  # Завершаем обработку после переадресации\n';
            }
            code += '    \n';

            // ============================================================================
            // ОБРАБОТКА УЗЛОВ СБОРА ВВОДА
            // ============================================================================
            // Генерируем ответ на основе типа узла
            if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
              // Обрабатываем узла сбора ввода
              const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пяяяжалуйяяяа, введите ваш отяяяет:";
              const responseType = targetNode.data.responseType || 'text';
              // Определяем тип ввода - если включены медиа-типы, используем их, иначе текст
              let inputType = 'text';
              if (targetNode.data.enablePhotoInput) {
                inputType = 'photo';
              } else if (targetNode.data.enableVideoInput) {
                inputType = 'video';
              } else if (targetNode.data.enableAudioInput) {
                inputType = 'audio';
              } else if (targetNode.data.enableDocumentInput) {
                inputType = 'document';
              } else {
                inputType = targetNode.data.inputType || 'text';
              }
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const saveToDatabase = targetNode.data.saveToDatabase || false;

              code += '    # Удаляем старое сообщение\n';
              code += '    \n';

              const formattedPrompt = formatTextForPython(inputPrompt);
              code += `    text = ${formattedPrompt}\n`;

              if (responseType === 'text') {
                code += '    await bot.send_message(callback_query.from_user.id, text)\n';

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
                const inlineTextCollect = targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true;

                if (inlineTextCollect) {
                  // Находим следующий узел через соединения
                  const nextConnection = connections.find(conn => conn.source === targetNode.id);
                  const nextNodeId = nextConnection ? nextConnection.target : null;

                  code += '    # Настраиваем ожидание ввода (collectUserInput=true)\n';
                  code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                  code += `        "type": "${inputType}",\n`;
                  code += `        "variable": "${inputVariable}",\n`;
                  code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "next_node_id": "${nextNodeId || ''}"\n`;
                  code += '    }\n';
                } else {
                  code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                }
              }
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем обязательный return в конец функции
            code += '    return\n';
          }
        }
      });
    }
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
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `            ${condition} next_node_id == "${targetNode.id}":\n`;

        if (targetNode.type === 'message' && targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          // Обработка узлов сообщений с inline клавиатурой
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);

          code += `                text = ${formattedText}\n`;
          code += '                builder = InlineKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: Button) => {
            if (button.action === "url") {
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
            } else if (button.action === 'goto') {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
            } else if (button.action === 'command') {
              const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
            } else {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
            }
          });
          code += '                keyboard = builder.as_markup()\n';
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';
        } else if (targetNode.type === 'message' && targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);

          code += `                text = ${formattedText}\n`;
          code += '                builder = ReplyKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: Button) => {
            if (button.action === "contact" && button.requestContact) {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
            } else if (button.action === "location" && button.requestLocation) {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
            } else {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
            }
          });
          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
          code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';

          // Проверяяяяям, нужно ли настроить ожядание текстового ввода
          // ИСПРАВЛЕНИЕ: Используем универяальную функцию для настройки ожидания ввода
          if (targetNode.data.enableTextInput || targetNode.data.collectUserInput ||
            targetNode.data.enablePhotoInput || targetNode.data.enableVideoInput ||
            targetNode.data.enableAudioInput || targetNode.data.enableDocumentInput) {
            code += generateWaitingStateCode(targetNode, '                ');
          }
        } else if (targetNode.type === 'message') {
          // Добавляем поддержку условных сообщений для узлов сообщений
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);

          if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
            code += '                # Проверяем усяяяяовные сообщения\n';
            code += '                text = None\n';
            code += '                \n';
            code += '                # Получаем данные пользователя для проверки условий\n';
            code += '                user_record = await get_user_from_db(user_id)\n';
            code += '                if not user_record:\n';
            code += '                    user_record = user_data.get(user_id, {})\n';
            code += '                \n';
            code += '                # Безопасно извлекаем user_data\n';
            code += '                if isinstance(user_record, dict):\n';
            code += '                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
            code += '                        user_data_dict = user_record["user_data"]\n';
            code += '                    else:\n';
            code += '                        user_data_dict = user_record\n';
            code += '                else:\n';
            code += '                    user_data_dict = {}\n';
            code += '                \n';

            // Генерируем условную логикяя с использованием вспомогательной функции
            code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '                ');

            // Добавляем резервный вариант
            code += '                else:\n';

            if (targetNode.data.fallbackMessage) {
              const fallbackText = formatTextForPython(targetNode.data.fallbackMessage);
              code += `                    text = ${fallbackText}\n`;
              code += '                    logging.info("Используется запасное сообщение")\n';
            } else {
              code += `                    text = ${formattedText}\n`;
              code += '                    logging.info("Используется основное сообщение узла")\n';
            }

            code += '                \n';
          } else {
            code += `                text = ${formattedText}\n`;
          }

          // Определяем режим форматирования (приоритет у условного сообщения)
          code += '                # Используем parse_mode условного сообщения если он установлен\n';
          code += '                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
          code += '                    parse_mode = conditional_parse_mode\n';
          code += '                else:\n';
          if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
            code += '                    parse_mode = ParseMode.MARKDOWN\n';
          } else if (targetNode.data.formatMode === 'html') {
            code += '                    parse_mode = ParseMode.HTML\n';
          } else {
            code += '                    parse_mode = None\n';
          }

          // Сохраняем медиа-переменные из данных узла в user_data (для использования в других узлах)
          if (targetNode.data.imageUrl) {
            code += `                # Сохраняем imageUrl в переменную image_url_${targetNode.id}\n`;
            code += `                user_id = message.from_user.id\n`;
            code += `                user_data[user_id] = user_data.get(user_id, {})\n`;
            code += `                user_data[user_id]["image_url_${targetNode.id}"] = "${targetNode.data.imageUrl}"\n`;
            code += `                await update_user_data_in_db(user_id, "image_url_${targetNode.id}", "${targetNode.data.imageUrl}")\n`;
          }
          if (targetNode.data.documentUrl) {
            code += `                # Сохраняем documentUrl в переменную document_url_${targetNode.id}\n`;
            code += `                user_id = message.from_user.id\n`;
            code += `                user_data[user_id] = user_data.get(user_id, {})\n`;
            code += `                user_data[user_id]["document_url_${targetNode.id}"] = "${targetNode.data.documentUrl}"\n`;
            code += `                await update_user_data_in_db(user_id, "document_url_${targetNode.id}", "${targetNode.data.documentUrl}")\n`;
          }
          if (targetNode.data.videoUrl) {
            code += `                # Сохраняем videoUrl в переменную video_url_${targetNode.id}\n`;
            code += `                user_id = message.from_user.id\n`;
            code += `                user_data[user_id] = user_data.get(user_id, {})\n`;
            code += `                user_data[user_id]["video_url_${targetNode.id}"] = "${targetNode.data.videoUrl}"\n`;
            code += `                await update_user_data_in_db(user_id, "video_url_${targetNode.id}", "${targetNode.data.videoUrl}")\n`;
          }
          if (targetNode.data.audioUrl) {
            code += `                # Сохраняем audioUrl в переменную audio_url_${targetNode.id}\n`;
            code += `                user_id = message.from_user.id\n`;
            code += `                user_data[user_id] = user_data.get(user_id, {})\n`;
            code += `                user_data[user_id]["audio_url_${targetNode.id}"] = "${targetNode.data.audioUrl}"\n`;
            code += `                await update_user_data_in_db(user_id, "audio_url_${targetNode.id}", "${targetNode.data.audioUrl}")\n`;
          }

          // Проверяем наличие медиа-контента (imageUrl, videoUrl, audioUrl, documentUrl)
          const hasImage = targetNode.data.imageUrl;
          const hasVideo = targetNode.data.videoUrl;
          const hasAudio = targetNode.data.audioUrl;
          const hasDocument = targetNode.data.documentUrl;

          if (hasImage || hasVideo || hasAudio || hasDocument) {
            // Отправляем медиа с текстом в качестве подписи (caption)
            if (hasImage) {
              code += `                await bot.send_photo(message.chat.id, "${targetNode.data.imageUrl}", caption=text, parse_mode=parse_mode)\n`;
            } else if (hasVideo) {
              code += `                await bot.send_video(message.chat.id, "${targetNode.data.videoUrl}", caption=text, parse_mode=parse_mode)\n`;
            } else if (hasAudio) {
              code += `                await bot.send_audio(message.chat.id, "${targetNode.data.audioUrl}", caption=text, parse_mode=parse_mode)\n`;
            } else if (hasDocument) {
              code += `                await bot.send_document(message.chat.id, "${targetNode.data.documentUrl}", caption=text, parse_mode=parse_mode)\n`;
            }
          } else {
            // Добавляем кнопки если есть
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              // Используем универсальную функцию для создания inline клавиатуры
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
            } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '                builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((button: { text: string; }) => {
                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
              });
              const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
              const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
              code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
            } else {
              code += '                await message.answer(text, parse_mode=parse_mode)\n';
            }
          }
        } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
          const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
          const responseType = targetNode.data.responseType || 'text';
          // Определяем тип ввода - если включены медиа-типы, используем их, иначе текст
          let inputType = 'text';
          if (targetNode.data.enablePhotoInput) {
            inputType = 'photo';
          } else if (targetNode.data.enableVideoInput) {
            inputType = 'video';
          } else if (targetNode.data.enableAudioInput) {
            inputType = 'audio';
          } else if (targetNode.data.enableDocumentInput) {
            inputType = 'document';
          } else {
            inputType = targetNode.data.inputType || 'text';
          }
          const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
          const minLength = targetNode.data.minLength || 0;
          const maxLength = targetNode.data.maxLength || 0;
          const inputTimeout = targetNode.data.inputTimeout || 60;
          const saveToDatabase = targetNode.data.saveToDatabase || false;
          const placeholder = targetNode.data.placeholder || "";
          const responseOptions = targetNode.data.responseOptions || [];
          const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
          const allowSkip = targetNode.data.allowSkip || false;

          code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
          if (placeholder) {
            code += `                placeholder_text = "${placeholder}"\n`;
            code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
          }

          // Проверяем, является ли это узлом ответа на кнопку
          if (responseType === 'buttons' && responseOptions.length > 0) {
            // Для узлов ответа на кнопки настраиваем button_response_config
            code += '                \n';
            code += '                # Создаем кнопки для выбора ответа\n';
            code += '                builder = InlineKeyboardBuilder()\n';

            // Создаем кнопки для вариантов ответа
            const responseButtons = responseOptions.map((option: ResponseOption | string, index: number) => {
              const normalizedOption: ResponseOption = typeof option === 'string'
                ? { text: option, value: option }
                : option;
              return {
                text: normalizedOption.text,
                action: 'goto',
                target: `response_${targetNode.id}_${index}`,
                id: `response_${targetNode.id}_${index}`
              };
            });

            if (allowSkip) {
              responseButtons.push({
                text: "⏭️ Пропустить",
                action: 'goto',
                target: `skip_${targetNode.id}`,
                id: `skip_${targetNode.id}`
              });
            }

            // Используем универсальную функцию для создания inline клавиатуры
            code += generateInlineKeyboardCode(responseButtons, '                ', targetNode.id, targetNode.data, allNodeIds);
            code += '                await message.answer(prompt_text, reply_markup=keyboard)\n';
            code += '                \n';
            code += '                # Настраиваем конфигурацию кнопочного ответа\n';
            code += '                user_data[user_id]["button_response_config"] = {\n';
            code += `                    "variable": "${inputVariable}",\n`;
            code += `                    "node_id": "${targetNode.id}",\n`;
            code += `                    "timeout": ${inputTimeout},\n`;
            code += `                    "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
            code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
            code += '                    "selected": [],\n';
            code += '                    "success_message": "",\n';
            code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
            code += '                    "options": [\n';

            // Добавляем каждый вариант ответа с индивидуальными настройками навигации
            responseOptions.forEach((option: ResponseOption, index: number) => {
              const optionValue = option.value || option.text;
              const action = option.action || 'goto';
              const target = option.target || '';
              const url = option.url || '';

              code += '                        {\n';
              code += `                            "text": "${escapeForJsonString(option.text)}",\n`;
              code += `                            "value": "${escapeForJsonString(optionValue)}",\n`;
              code += `                            "action": "${action}",\n`;
              code += `                            "target": "${target}",\n`;
              code += `                            "url": "${url}",\n`;
              code += `                            "callback_data": "response_${targetNode.id}_${index}"\n`;
              code += '                        }';
              if (index < responseOptions.length - 1) {
                code += ',';
              }
              code += '\n';
            });

            code += '                    ],\n';

            // Находим следующий узел для этого user-input узла (fallback)
            const nextConnection = connections.find(conn => conn.source === targetNode.id);
            if (nextConnection) {
              code += `                    "next_node_id": "${nextConnection.target}"\n`;
            } else {
              code += '                    "next_node_id": None\n';
            }
            code += '                }\n';
          } else {
            // Для узлов текстового ввода используем waiting_for_input
            code += '                await message.answer(prompt_text)\n';
            code += '                \n';

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
            const textNodeCollectInput = targetNode.data.collectUserInput === true ||
              targetNode.data.enableTextInput === true ||
              targetNode.data.enablePhotoInput === true ||
              targetNode.data.enableVideoInput === true ||
              targetNode.data.enableAudioInput === true ||
              targetNode.data.enableDocumentInput === true;

            if (textNodeCollectInput) {
              code += '                # Настраиваем ожидание ввода (collectUserInput=true)\n';
              code += '                user_data[user_id]["waiting_for_input"] = {\n';
              code += `                    "type": "${inputType}",\n`;
              code += `                    "variable": "${inputVariable}",\n`;
              code += '                    "validation": "",\n';
              code += `                    "min_length": ${minLength},\n`;
              code += `                    "max_length": ${maxLength},\n`;
              code += `                    "timeout": ${inputTimeout},\n`;
              code += '                    "required": True,\n';
              code += '                    "allow_skip": False,\n';
              code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
              code += '                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
              code += '                    "success_message": "",\n';
              code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
              code += `                    "node_id": "${targetNode.id}",\n`;

              // Находим следующий узел для этого user-input узла
              const nextConnection = connections.find(conn => conn.source === targetNode.id);
              if (nextConnection) {
                code += `                    "next_node_id": "${nextConnection.target}"\n`;
              } else {
                code += '                    "next_node_id": None\n';
              }
              code += '                }\n';
            } else {
              code += `                # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
            }
          }
        } else if (targetNode.type === 'message') {
          // Обработка узлов сообщений
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                await fake_message.answer(${formattedText})\n`;
          code += `                logging.info(f"Отправлено сообщение узла ${targetNode.id}")\n`;
        } else {
          // Для других типов узлов просто логируем
          code += `                logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
        }
      });

      code += '            else:\n';
      code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    } else {
      code += '            # No nodes available for navigation\n';
      code += '            logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
    }
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '\n';
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




