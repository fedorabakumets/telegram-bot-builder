// Внешние зависимости
import { z } from 'zod';
import { BotData, Node, BotGroup, buttonSchema } from '@shared/schema';

// Внутренние модули - использование экспорта бочек
import { generateBotFatherCommands } from './commands';
import { generateSynonymHandlers } from './generate/generate-synonym-handlers';
import { generatePhotoHandlerCode, hasPhotoInput } from './photo-handler';
import { generateVideoHandlerCode, hasVideoInput } from './video-handler';
import { generateAudioHandlerCode, hasAudioInput } from './audio-handler';
import { generateDocumentHandlerCode, hasDocumentInput } from './document-handler';
import { generateConditionalButtonHandlerCode, hasConditionalValueButtons } from './conditional-button-handler';
import { generateHideAfterClickMiddleware } from './handlers/generateHideAfterClickHandler';
import { generateReplyHideAfterClickHandler } from './handlers/generateReplyHideAfterClickHandler';
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
  getParseMode,
  generateButtonText
} from './format';
import { generateConditionalMessageLogic } from './Conditional';
import { generateInlineKeyboardCode, generateReplyKeyboardCode } from './Keyboard';
import { hasMediaNodes, hasInputCollection, hasInlineButtons, hasAutoTransitions } from './has';
import { generateRequirementsTxt, generateDockerfile, generateReadme, generateConfigYaml } from './scaffolding';
import { processInlineButtonNodes, processConnectionTargets } from './process';
import { collectInputTargetNodes, } from './collect';
import { filterInlineNodes } from './filterInlineNodes';
import { addInputTargetNodes } from './add';
import { generateDatabaseCode, generateNodeNavigation, generateUtf8EncodingCode, generateSafeEditOrSendCode, generateBasicBotSetupCode, generateGroupsConfiguration, generateUtilityFunctions } from './generate';
import { generateMessageLoggingCode } from './generate/generate-message-logging';
import { extractNodeData } from './extractNodeData';
import { generateUniversalVariableReplacement } from './utils/generateUniversalVariableReplacement';
import { collectConditionalMessageButtons } from './collect/collectConditionalMessageButtons';
import { addAutoTransitionNodes } from './add/addAutoTransitionNodes';
import { generateNodeHandlers } from './generate/generate-node-handlers';
import { generateBotCommandsSetup } from './bot-commands-setup';
import { generateButtonResponseHandlers } from './generate/generateButtonResponseHandlers';
import { generateReplyButtonHandlers } from './generate-reply-button-handlers';
import { generateMultiSelectReplyHandler } from './generateMultiSelectReplyHandler';
import { generateGroupHandlers } from './generateGroupHandlers';
import { generateMultiSelectDoneHandler } from './generateMultiSelectDoneHandler';
import { generateMultiSelectCallbackLogic } from './generateMultiSelectCallbackLogic';
import { generateMediaFileFunctions } from './generateMediaFileFunctions';


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
  code += generateMessageLoggingCode(userDatabaseEnabled, nodes || [], projectId, hasInlineButtons(nodes || []));

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
            // ИСПРАВЛЕНИЕ: Проверяем наличие прикрепленных медиа перед отправкой
            const attachedMedia = targetNode.data.attachedMedia || [];

            if (attachedMedia.length > 0) {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} имеет attachedMedia:`, attachedMedia);
              // Генерируем код отправки с медиа
              const parseModeStr = targetNode.data.formatMode || '';
              const keyboardStr = 'keyboard if keyboard is not None else None';
              // Определяем, собирает ли узел ввод (учитываем все типы ввода)
              const collectUserInputFlag = targetNode.data.collectUserInput !== false ||
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
                collectUserInputFlag
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
                    const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
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
                            code += '                # Создаем клавиатуру для условного сообщения\n';

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
    if (hasInputCollection(nodes || [])) {
      code += '\n\n# Универсальный обработчик пользовательского ввода\n';
      code += '@dp.message(F.text)\n';
      code += 'async def handle_user_input(message: types.Message):\n';
      code += '    user_id = message.from_user.id\n';
      code += '    \n';
      code += '    # Инициализируем базовые переменные пользователя\n';
      code += '    user_name = init_user_variables(user_id, message.from_user)\n';
      code += '    \n';
      code += generateUniversalVariableReplacement('    ');
      code += '    \n';
      code += '    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick\n';
      code += `    ${generateReplyHideAfterClickHandler(nodes)}\n`;
      code += '    \n';
      /**
       * Обработчик условных сообщений
       * Проверяет, ожидает ли пользователь ввод для условного сообщения,
       * обрабатывает кнопки skipDataCollection и сохраняет ответы пользователя
       */
      code += '    # Проверяем, ожидаем ли мы ввод для условного сообщения\n';
      code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
      code += '        config = user_data[user_id]["waiting_for_conditional_input"]\n';
      code += '        user_text = message.text\n';
      code += '        \n';
      
      /**
       * Проверка кнопок skipDataCollection
       * Ищет нажатую кнопку среди кнопок пропуска сбора данных
       * и выполняет переход к указанному узлу без сохранения данных
       */
      code += '        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n';
      code += '        skip_buttons = config.get("skip_buttons", [])\n';
      code += '        skip_button_target = None\n';
      code += '        for skip_btn in skip_buttons:\n';
      code += '            if skip_btn.get("text") == user_text:\n';
      code += '                skip_button_target = skip_btn.get("target")\n';
      code += '                logging.info(f"⏭️ Нажата кнопка с skipDataCollection: {user_text} -> {skip_button_target}")\n';
      code += '                break\n';
      code += '        \n';
      
      /**
       * Навигация при нажатии кнопки пропуска
       * Очищает состояние ожидания и переходит к целевому узлу кнопки
       */
      code += '        # Если нажата кнопка пропуска - переходим к её target без сохранения\n';
      code += '        if skip_button_target:\n';
      code += '            # Очищаем состояние ожидания\n';
      code += '            del user_data[user_id]["waiting_for_conditional_input"]\n';
      code += '            \n';
      code += '            # Переходим к целевому узлу кнопки\n';
      code += '            try:\n';
      code += '                logging.info(f"🚀 Переходим к узлу кнопки skipDataCollection: {skip_button_target}")\n';
      code += '                import types as aiogram_types\n';
      code += '                fake_callback = aiogram_types.SimpleNamespace(\n';
      code += '                    id="skip_button_nav",\n';
      code += '                    from_user=message.from_user,\n';
      code += '                    chat_instance="",\n';
      code += '                    data=skip_button_target,\n';
      code += '                    message=message,\n';
      code += '                    answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
      code += '                )\n';

      // Генерируем навигацию для кнопок skipDataCollection
      if (nodes.length > 0) {
        nodes.forEach((targetNode, idx) => {
          const cond = idx === 0 ? 'if' : 'elif';
          const safeFnName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `                ${cond} skip_button_target == "${targetNode.id}":\n`;
          code += `                    await handle_callback_${safeFnName}(fake_callback)\n`;
        });
        code += '                else:\n';
        code += '                    logging.warning(f"Неизвестный целевой узел кнопки skipDataCollection: {skip_button_target}")\n';
      }

      code += '            except Exception as e:\n';
      code += '                logging.error(f"Ошибка при переходе к узлу кнопки skipDataCollection {skip_button_target}: {e}")\n';
      code += '            return\n';
      /**
       * Сохранение ответа пользователя
       * Сохраняет введенный текст в пользовательские данные и базу данных
       * с поддержкой автоматического именования переменных
       */
      code += '        \n';
      code += '        # Сохраняем текстовый ввод для условного сообщения (обычный случай без skipDataCollection)\n';
      code += '        condition_id = config.get("condition_id", "unknown")\n';
      code += '        next_node_id = config.get("next_node_id")\n';
      code += '        \n';
      code += '        # Сохраняем ответ пользователя\n';
      code += '        timestamp = get_moscow_time()\n';
      code += '        # Используем переменную из конфигурации или создаем автоматическую\n';
      code += '        input_variable = config.get("input_variable", "")\n';
      code += '        if input_variable:\n';
      code += '            variable_name = input_variable\n';
      code += '        else:\n';
      code += '            variable_name = f"conditional_response_{condition_id}"\n';
      code += '        \n';
      code += '        # Сохраняем в пользовательские данные\n';
      code += '        user_data[user_id][variable_name] = user_text\n';
      code += '        \n';
      code += '        # Сохраняем в базу данных\n';
      code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, user_text)\n';
      code += '        if saved_to_db:\n';
      code += '            logging.info(f"✅ Условный ответ сохранен в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
      code += '        else:\n';
      code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
      code += '        \n';
      code += '        # Очищаем состояние ожидания\n';
      code += '        del user_data[user_id]["waiting_for_conditional_input"]\n';
      code += '        \n';
      code += '        logging.info(f"Получен ответ на условное сообщение: {variable_name} = {user_text}")\n';
      code += '        \n';
      
      /**
       * Навигация после сохранения ответа
       * Переходит к следующему узлу если указан, с поддержкой команд
       */
      code += '        # Переходим к следующему узлу если указан\n';
      code += '        if next_node_id:\n';
      code += '            try:\n';
      code += '                logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
      code += '                \n';
      code += '                # Проверяем, является ли это командой\n';
      code += '                if next_node_id == "profile_command":\n';
      code += '                    logging.info("Переход к команде /profile")\n';
      code += '                    await profile_handler(message)\n';
      code += '                else:\n';
      code += '                    # Создаем фиктивный callback для навигации к обычному узлу\n';
      code += '                    import types as aiogram_types\n';
      code += '                    fake_callback = aiogram_types.SimpleNamespace(\n';
      code += '                        id="conditional_nav",\n';
      code += '                        from_user=message.from_user,\n';
      code += '                        chat_instance="",\n';
      code += '                        data=next_node_id,\n';
      code += '                        message=message,\n';
      code += '                        answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
      code += '                    )\n';
      code += '                    \n';

      if (nodes.length > 0) {
        nodes.forEach((targetNode, index) => {
          const condition = index === 0 ? 'if' : 'elif';
          const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `                    ${condition} next_node_id == "${targetNode.id}":\n`;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
          if (targetNode.data.allowMultipleSelection === true) {
            // Для узлов с множественным выбором создаем прямую навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                        # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
            code += `                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: ${targetNode.id}")\n`;
            code += `                        text = ${formattedText}\n`;

            // Замена переменных
            code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                        ');

            // Инициализируем состояние множественного выбора
            code += `                        # Инициализируем состояние множественного выбора\n`;
            code += `                        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
            code += `                        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `                        user_data[user_id]["multi_select_type"] = "selection"\n`;
            if (targetNode.data.multiSelectVariable) {
              code += `                        user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
            }

            // Создаем inline клавиатуру с кнопками выбора
            if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
              code += `                        await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `                        await message.answer(text)\n`;
            }
            code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
          } else {
            // Для обычных узлов проверяем сначала, собирают ли они ввод
            if (targetNode.data.collectUserInput === true) {
              // Проверяем, есть ли условные сообщения для этого узла
              const hasConditionalMessages = targetNode.data.enableConditionalMessages &&
                targetNode.data.conditionalMessages &&
                targetNode.data.conditionalMessages.length > 0;

              if (hasConditionalMessages) {
                // Для узлов с условными сообщениями генерируем встроенную логику проверки
                code += `                        # Узел с условными сообщениями - проверяем условия\n`;
                code += `                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: ${targetNode.id}")\n`;
                code += `                        user_data_dict = await get_user_from_db(user_id) or {}\n`;
                code += `                        user_data_dict.update(user_data.get(user_id, {}))\n`;

                // Генерируем логику проверки условий встроенно
                const conditionalMessages = targetNode.data.conditionalMessages.sort((a: { priority: any; }, b: { priority: any; }) => (b.priority || 0) - (a.priority || 0));

                code += `                        # Функция для проверки переменных пользователя\n`;
                code += `                        def check_user_variable_inline(var_name, user_data_dict):\n`;
                code += `                            if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
                code += `                                try:\n`;
                code += `                                    import json\n`;
                code += `                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
                code += `                                    if var_name in parsed_data:\n`;
                code += `                                        raw_value = parsed_data[var_name]\n`;
                code += `                                        if isinstance(raw_value, dict) and "value" in raw_value:\n`;
                code += `                                            var_value = raw_value["value"]\n`;
                code += `                                            if var_value is not None and str(var_value).strip() != "":\n`;
                code += `                                                return True, str(var_value)\n`;
                code += `                                        else:\n`;
                code += `                                            if raw_value is not None and str(raw_value).strip() != "":\n`;
                code += `                                                return True, str(raw_value)\n`;
                code += `                                except (json.JSONDecodeError, TypeError):\n`;
                code += `                                    pass\n`;
                code += `                            if var_name in user_data_dict:\n`;
                code += `                                variable_data = user_data_dict.get(var_name)\n`;
                code += `                                if isinstance(variable_data, dict) and "value" in variable_data:\n`;
                code += `                                    var_value = variable_data["value"]\n`;
                code += `                                    if var_value is not None and str(var_value).strip() != "":\n`;
                code += `                                        return True, str(var_value)\n`;
                code += `                                elif variable_data is not None and str(variable_data).strip() != "":\n`;
                code += `                                    return True, str(variable_data)\n`;
                code += `                            return False, None\n`;
                code += `                        \n`;

                // Генерируем условия
                code += `                        conditional_met = False\n`;
                for (let i = 0; i < conditionalMessages.length; i++) {
                  const condition = conditionalMessages[i];
                  const variableNames = condition.variableNames && condition.variableNames.length > 0
                    ? condition.variableNames
                    : (condition.variableName ? [condition.variableName] : []);
                  const logicOperator = condition.logicOperator || 'AND';
                  const conditionKeyword = i === 0 ? 'if' : 'elif';

                  if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                    code += `                        ${conditionKeyword} (\n`;
                    for (let j = 0; j < variableNames.length; j++) {
                      const varName = variableNames[j];
                      const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                      code += `                            check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
                    }
                    code += `                        ):\n`;
                    code += `                            conditional_met = True\n`;

                    // Генерируем текст и клавиатуру для условия
                    const cleanedText = stripHtmlTags(condition.messageText);
                    const formattedText = formatTextForPython(cleanedText);
                    code += `                            text = ${formattedText}\n`;

                    // Заменяем переменные
                    for (const varName of variableNames) {
                      code += `                            _, var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} = check_user_variable_inline("${varName}", user_data_dict)\n`;
                      code += `                            if "{${varName}}" in text and var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} is not None:\n`;
                      code += `                                text = text.replace("{${varName}}", var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')})\n`;
                    }

                    // Когда условие выполнено (переменная уже есть), отмечаем это
                    code += `                            conditional_met = True\n`;
                    code += `                            logging.info(f"✅ Условие выполнено: переменная суяесявует")\n`;

                    // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода
                    const shouldWaitForInput = condition.waitForTextInput === true;

                    if (shouldWaitForInput) {
                      // Показываем сообщение и настраиваем ожидание ввода
                      code += `                            # waitForTextInput=true: показываем сообщение и ждем ввода\n`;

                      const inputVariable = condition.textInputVariable || targetNode.data.inputVariable || `response_${targetNode.id}`;
                      const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                      // Проверяем, есть ли кнопки в условном сообщении
                      const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                      if (hasConditionalButtons) {
                        // Генерируем клавиатуру с кнопками из условного сообщения
                        code += `                            # Генерируем клавиатуру с кнопками из условного сообщения\n`;
                        code += `                            builder = ReplyKeyboardBuilder()\n`;

                        for (const button of condition.buttons) {
                          let buttonText = button.text || 'Кнопка';
                          const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                          // Заменяем переменные в тексте кнопки
                          let hasVariable = false;
                          for (const varName of variableNames) {
                            if (buttonText.includes(`{${varName}}`)) {
                              code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                              code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                              code += `                            if btn_var_value is not None:\n`;
                              code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                              buttonText = `btn_text_${safeButtonId}`;
                              hasVariable = true;
                              break;
                            }
                          }

                          if (!hasVariable) {
                            buttonText = `"${buttonText}"`;
                          }

                          code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                        }

                        code += `                            builder.adjust(1)\n`;
                        // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                        const conditionOneTimeKeyboard1 = toPythonBoolean(condition.oneTimeKeyboard === true);
                        code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard1})\n`;

                        // Отправляем сообщение с клавиатурой
                        const mainMessageText = targetNode.data.messageText || 'Выберите действие';
                        const mainFormattedText = formatTextForPython(mainMessageText);
                        code += `                            main_text = ${mainFormattedText}\n`;
                        code += `                            await message.answer(main_text, reply_markup=keyboard)\n`;

                        // Устанавливаем ожидание ввода, даже если есть клавиатура
                        // Пользователь может ввести текст вместо нажатия кнопки
                        code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                        code += `                                "type": "text",\n`;
                        code += `                                "variable": "${inputVariable}",\n`;
                        code += `                                "save_to_database": True,\n`;
                        code += `                                "node_id": "${targetNode.id}",\n`;
                        code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                        code += `                            }\n`;
                        code += `                            logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id}")\n`;
                      } else {
                        // Нет кнопок - показываем сообщение и ждем текстового ввода
                        code += `                            # Если условный текст пустой, используем основное сообщение узла\n`;
                        code += `                            if text and text.strip():\n`;
                        code += `                                await message.answer(text)\n`;
                        code += `                            else:\n`;

                        // Используем основное сообщение узла
                        const mainMessageText = targetNode.data.messageText || 'Введите данные';
                        const mainFormattedText = formatTextForPython(mainMessageText);
                        code += `                                main_text = ${mainFormattedText}\n`;
                        code += `                                await message.answer(main_text)\n`;
                        code += `                            \n`;

                        code += `                            # Настраиваем ожидание ввода для условного сообщения\n`;
                        code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                        code += `                                "type": "text",\n`;
                        code += `                                "variable": "${inputVariable}",\n`;
                        code += `                                "save_to_database": True,\n`;
                        code += `                                "node_id": "${targetNode.id}",\n`;
                        code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                        code += `                            }\n`;
                        code += `                            logging.info(f"✅ Состояние ожидания настроено: text ввод для переменной ${inputVariable} (условное сообщение, узел ${targetNode.id})")\n`;
                      }
                    } else {
                      // ИСПРАВЛЕНИЕ: Проверяем, есть ли кнопки в условном сообщении
                      const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;

                      if (hasConditionalButtons) {
                        // Если есть условные кнопки - показываем их и НЕ делаем автопереход
                        // Кнопки сами ведут к целевым узлам
                        code += `                            # Условное сообщение с кнопками: показываем клавиатуру\n`;
                        code += `                            builder = ReplyKeyboardBuilder()\n`;

                        for (const button of condition.buttons) {
                          let buttonText = button.text || 'Кнопка';
                          const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');

                          // Заменяем переменные в тексте кнопки
                          let hasVariable = false;
                          for (const varName of variableNames) {
                            if (buttonText.includes(`{${varName}}`)) {
                              code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                              code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                              code += `                            if btn_var_value is not None:\n`;
                              code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                              buttonText = `btn_text_${safeButtonId}`;
                              hasVariable = true;
                              break;
                            }
                          }

                          if (!hasVariable) {
                            buttonText = `"${buttonText}"`;
                          }

                          code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                        }

                        code += `                            builder.adjust(1)\n`;
                        // ИСПРАВЛЕНИЕ: Используем oneTimeKeyboard из настроек условного сообщения
                        const conditionOneTimeKeyboard2 = toPythonBoolean(condition.oneTimeKeyboard === true);
                        code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=${conditionOneTimeKeyboard2})\n`;
                        code += `                            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, node_id="${targetNode.id}")\n`;
                        code += `                            logging.info(f"✅ Показана условная клавиатура (кнопяи ведут напрямую, автопереход НЕ выполняется)")\n`;
                      } else {
                        // Нет кнопок - автоматически переходим к следующему узлу
                        const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;
                        if (nextNodeAfterCondition) {
                          code += `                            # Переменная уже существует, автоматически переходим к узлу: ${nextNodeAfterCondition}\n`;
                          code += `                            logging.info(f"✅ Условие выполнено: переменная существует, автоматически переходим к следующему узлу")\n`;
                          code += `                            # Рекурсивно обрабатываем следующий узел через ту же систему навигации\n`;
                          code += `                            next_node_id_auto = "${nextNodeAfterCondition}"\n`;
                          code += `                            logging.info(f"я Автоматический переход к уялу: {next_node_id_auto}")\n`;
                        } else {
                          code += `                            # Переменная яуществует, но слядующий узел не указан - завершаем обработяу\n`;
                        }
                      }
                    }
                  }
                }

                // Fallback если условия не выпоянены
                code += `                        if not conditional_met:\n`;
                code += `                            # Условие не выполнено - показываем основнояя сообщение\n`;
                const messageText = targetNode.data.messageText || 'Сообщение';
                const formattedText = formatTextForPython(messageText);
                code += `                            text = ${formattedText}\n`;
                code += `                            await message.answer(text)\n`;

                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                code += `                                "type": "text",\n`;
                code += `                                "modes": ["text"],\n`;
                code += `                                "variable": "${inputVariable}",\n`;
                code += `                                "save_to_database": True,\n`;
                code += `                                "node_id": "${targetNode.id}",\n`;
                code += `                                "next_node_id": "${inputTargetNodeId || ''}"\n`;
                code += `                            }\n`;
                code += `                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
              } else {
                const messageText = targetNode.data.messageText || 'Сообщение';
                const formattedText = formatTextForPython(messageText);

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: У узла есть кяяопки - показываем ях И настраиваем ожидание ввода
                if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += `                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа\n`;
                  code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput=true")\n`;
                  code += `                        text = ${formattedText}\n`;

                  // Дояяяяавляем замену переменных
                  code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
                  code += generateUniversalVariableReplacement('                        ');

                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Генерируем правильный тип клавиатуры в завясимости от keyboardType
                  if (targetNode.data.keyboardType === 'reply') {
                    code += '                        # Создаем reply клавиатуру\n';
                    code += '                        builder = ReplyKeyboardBuilder()\n';
                    targetNode.data.buttons.forEach((btn: Button) => {
                      code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    });
                    const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                    const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                    code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  } else {
                    // Генерируем inline клавиатуру
                    code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
                  }
                  code += `                        await message.answer(text, reply_markup=keyboard)\n`;

                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также яастраиваем waiting_for_input для сохранения ответа кнопки
                  const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                  const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                  // Определяем modes - если есть enableTextInput, добавляем и text и button
                  const hasTextInput = targetNode.data.enableTextInput === true;
                  const btnModesList = hasTextInput ? "['button', 'text']" : "['button']";
                  // Собираем кнопки с skipDataCollection для кнопок
                  const skipButtons2572 = (targetNode.data.buttons || [])
                    .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                    .map((btn: any) => ({ text: btn.text, target: btn.target }));
                  const skipButtonsJson2572 = JSON.stringify(skipButtons2572);

                  code += `                        # Настраиваем ожидание ввода для сохранения ответа кнопки\n`;
                  code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
                  code += `                            "type": "button",\n`;
                  code += `                            "modes": ${hasTextInput ? "['button', 'text']" : "['button']"},\n`;
                  code += `                            "variable": "${inputVariable}",\n`;
                  code += `                            "save_to_database": True,\n`;
                  code += `                            "node_id": "${targetNode.id}",\n`;
                  code += `                            "next_node_id": "${inputTargetNodeId || ''}",\n`;
                  code += `                            "skip_buttons": ${skipButtonsJson2572}\n`;
                  code += `                        }\n`;
                  code += `                        logging.info(f"✅ Сояяяятояние ожидания настроено: modes=${btnModesList} для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
                } else {
                  // Обычное ожидание ввода если кнопок нет
                  code += `                        # Узел собирает пользовательский ввод\n`;
                  code += `                        logging.info(f"🔧 Условная навигация к узлу с вводом: ${targetNode.id}")\n`;
                  code += `                        text = ${formattedText}\n`;

                  // Настраиваем ожидание ввода
                  const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                  const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                  code += `                        await message.answer(text)\n`;
                  code += `                        # Настраиваем ожидание ввода\n`;
                  code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
                  code += `                            "type": "text",\n`;
                  code += `                            "modes": ["text"],\n`;
                  code += `                            "variable": "${inputVariable}",\n`;
                  code += `                            "save_to_database": True,\n`;
                  code += `                            "node_id": "${targetNode.id}",\n`;
                  code += `                            "next_node_id": "${inputTargetNodeId || ''}"\n`;
                  code += `                        }\n`;
                  code += `                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
                }
              }
            } else {
              // Обычная навигация с простым сообщением
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);
              code += `                        # Обычный узел - отправляем сообщение\n`;
              code += `                        text = ${formattedText}\n`;

              // Добавляем замену переменных
              code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
              code += generateUniversalVariableReplacement('                        ');

              // Проверяем, есть ли reply кнопки
              if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '                        # Создаем reply клавиатуру\n';
                code += '                        builder = ReplyKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button) => {
                  code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                });
                const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                code += '                        await message.answer(text, reply_markup=keyboard)\n';
              } else if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '                        # Создаем inline клавиатуру\n';
                code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
                code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                code += '                        await message.answer(text, reply_markup=keyboard)\n';
              } else {
                code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
                code += '                        await message.answer(text)\n';
              }
            }
          }
        });
        code += '                    else:\n';
        code += '                        logging.warning(f"Неизвестныя следующий узел: {next_node_id}")\n';
      } else {
        code += '                    # No nodes available for navigation\n';
        code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
      }

      code += '            except Exception as e:\n';
      code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
      code += '        \n';
      code += '        return  # Завершаем обработку для условного сообщения\n';
      code += '    \n';
      /**
       * Обработка кнопочных ответов через reply клавиатуру
       * Обрабатывает выбор пользователя из предложенных вариантов reply клавиатуры
       */
      code += '    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру\n';
      code += '    if user_id in user_data and "button_response_config" in user_data[user_id]:\n';
      code += '        config = user_data[user_id]["button_response_config"]\n';
      code += '        user_text = message.text\n';
      code += '        \n';
      
      /**
       * Поиск выбранного варианта
       * Ищет нажатую кнопку среди доступных опций в конфигурации
       */
      code += '        # Ищем выбранный вариант среди доступных опций\n';
      code += '        selected_option = None\n';
      code += '        for option in config.get("options", []):\n';
      code += '            if option["text"] == user_text:\n';
      code += '                selected_option = option\n';
      code += '                break\n';
      code += '        \n';
      
      /**
       * Обработка выбранного варианта
       * Сохраняет выбор пользователя в структурированном формате
       */
      code += '        if selected_option:\n';
      code += '            selected_value = selected_option["value"]\n';
      code += '            selected_text = selected_option["text"]\n';
      code += '            \n';
      code += '            # Сохраняем ответ пользователя\n';
      code += '            variable_name = config.get("variable", "button_response")\n';
      code += '            timestamp = get_moscow_time()\n';
      code += '            node_id = config.get("node_id", "unknown")\n';
      code += '            \n';
      
      /**
       * Создание структурированного ответа
       * Формирует объект с метаданными о выборе пользователя
       */
      code += '            # Создаем структурированный ответ\n';
      code += '            response_data = {\n';
      code += '                "value": selected_value,\n';
      code += '                "text": selected_text,\n';
      code += '                "type": "button_choice",\n';
      code += '                "timestamp": timestamp,\n';
      code += '                "nodeId": node_id,\n';
      code += '                "variable": variable_name\n';
      code += '            }\n';
      code += '            \n';
      code += '            # Сохраняем в пользовательские данные\n';
      code += '            user_data[user_id][variable_name] = response_data\n';
      code += '            \n';
      code += '            # Сохраняем в базу данных если включено\n';
      code += '            if config.get("save_to_database"):\n';
      code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
      code += '                if saved_to_db:\n';
      code += '                    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
      code += '                else:\n';
      code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
      code += '            \n';
      
      /**
       * Подтверждение выбора
       * Отправляет сообщение об успешном выборе и удаляет клавиатуру
       */
      code += '            # Отправляем сообщение об успехе\n';
      code += '            success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
      code += '            await message.answer(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())\n';
      code += '            \n';
      code += '            # Очищаем состояние\n';
      code += '            del user_data[user_id]["button_response_config"]\n';
      code += '            \n';
      code += '            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")\n';
      code += '            \n';
      
      /**
       * Навигация на основе действия кнопки
       * Выполняет различные действия в зависимости от типа выбранной кнопки
       */
      code += '            # Навигация на основе действия кнопки\n';
      code += '            option_action = selected_option.get("action", "goto")\n';
      code += '            option_target = selected_option.get("target", "")\n';
      code += '            option_url = selected_option.get("url", "")\n';
      code += '            \n';
      
      /**
       * Обработка различных типов действий
       * Поддерживает переходы по URL, выполнение команд и навигацию к узлам
       */
      code += '            if option_action == "url" and option_url:\n';
      code += '                # Открытие ссылки\n';
      code += '                url = option_url\n';
      code += '                keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
      code += '                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n';
      code += '                ])\n';
      code += '                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n';
      code += '            elif option_action == "command" and option_target:\n';
      
      /**
       * Выполнение команды
       * Создает фиктивное сообщение и вызывает соответствующий обработчик команды
       */
      code += '                # Выполнение команды\n';
      code += '                command = option_target\n';
      code += '                # Создаем фиктивное сообщение для выполнения команды\n';
      code += '                import types as aiogram_types\n';
      code += '                fake_message = aiogram_types.SimpleNamespace(\n';
      code += '                    from_user=message.from_user,\n';
      code += '                    chat=message.chat,\n';
      code += '                    text=command,\n';
      code += '                    message_id=message.message_id\n';
      code += '                )\n';
      code += '                \n';

      // Добавляем обработку различных команд для reply клавиатур
      const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
      commandNodes.forEach((cmdNode, cmdIndex) => {
        const condition = cmdIndex === 0 ? 'if' : 'elif';
        code += `                ${condition} command == "${cmdNode.data.command}":\n`;
        code += `                    try:\n`;
        code += `                        await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
        code += `                    except Exception as e:\n`;
        code += `                        logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
      });
      if (commandNodes.length > 0) {
        code += `                else:\n`;
        code += `                    logging.warning(f"Неизвестная команда: {command}")\n`;
      }

      code += '            elif option_action == "goto" and option_target:\n';
      code += '                # Переход к узлу\n';
      code += '                target_node_id = option_target\n';
      code += '                try:\n';
      code += '                    # Вызываем обработчик для целевого узла\n';

      // Генерируем логику навигации для ответов на кнопки ответов  
      if (nodes.length > 0) {
        nodes.forEach((btnNode, btnIndex) => {
          const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const condition = btnIndex === 0 ? 'if' : 'elif';
          code += `                    ${condition} target_node_id == "${btnNode.id}":\n`;
          code += `                        await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))\n`;
        });
        code += '                    else:\n';
        code += '                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
      } else {
        code += '                    pass  # No nodes to handle\n';
      }
      code += '                except Exception as e:\n';
      code += '                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
      code += '            else:\n';
      code += '                # Fallback к старой системе next_node_id если нет action\n';
      code += '                next_node_id = config.get("next_node_id")\n';
      code += '                if next_node_id:\n';
      code += '                    try:\n';
      code += '                        # Вызываем обработчик для следующего узла\n';

      if (nodes.length > 0) {
        nodes.forEach((btnNode, btnIndex) => {
          const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const condition = btnIndex === 0 ? 'if' : 'elif';
          code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
          code += `                            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))\n`;
        });
        code += '                        else:\n';
        code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
      } else {
        code += '                        pass  # No nodes to handle\n';
      }
      code += '                    except Exception as e:\n';
      code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
      code += '            return\n';
      code += '        else:\n';
      code += '            # Неверный выбор - показываем доступные варианты\n';
      code += '            available_options = [option["text"] for option in config.get("options", [])]\n';
      code += '            options_text = "\\n".join([f"• {opt}" for opt in available_options])\n';
      code += '            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\\n\\n{options_text}")\n';
      code += '            return\n';
      code += '    \n';
      /**
       * Обработка кнопок пропуска для медиа-узлов
       * Специальная обработка для узлов, ожидающих медиа-файлы (фото/видео/аудио/документы)
       * когда пользователь нажимает reply-кнопку с skipDataCollection
       */
      code += '    # ИСПРАВЛЕНИЕ: Проверяем pending_skip_buttons для медиа-узлов (фото/видео/аудио)\n';
      code += '    # Эта проверка нужна когда узел ожидает медиа, но пользователь нажал reply-кнопку с skipDataCollection\n';
      code += '    if user_id in user_data and "pending_skip_buttons" in user_data[user_id]:\n';
      code += '        pending_buttons = user_data[user_id]["pending_skip_buttons"]\n';
      code += '        user_text = message.text\n';
      
      /**
       * Поиск нажатой кнопки пропуска
       * Проверяет, была ли нажата одна из кнопок пропуска для медиа-узла
       */
      code += '        for skip_btn in pending_buttons:\n';
      code += '            if skip_btn.get("text") == user_text:\n';
      code += '                skip_target = skip_btn.get("target")\n';
      code += '                logging.info(f"⏭️ Нажата кнопка skipDataCollection для медиа-узла: {user_text} -> {skip_target}")\n';
      
      /**
       * Очистка состояний ожидания медиа
       * Удаляет все состояния, связанные с ожиданием медиа-файлов
       */
      code += '                # Очищаем pending_skip_buttons и любые медиа-ожидания\n';
      code += '                if "pending_skip_buttons" in user_data[user_id]:\n';
      code += '                    del user_data[user_id]["pending_skip_buttons"]\n';
      code += '                # Проверяем и очищаем waiting_for_input если тип соответствует медиа\n';
      code += '                if "waiting_for_input" in user_data[user_id]:\n';
      code += '                    waiting_config = user_data[user_id]["waiting_for_input"]\n';
      code += '                    if isinstance(waiting_config, dict) and waiting_config.get("type") in ["photo", "video", "audio", "document"]:\n';
      code += '                        del user_data[user_id]["waiting_for_input"]\n';
      
      /**
       * Навигация после пропуска медиа
       * Переходит к целевому узлу после нажатия кнопки пропуска
       */
      code += '                # Переходим к целевому узлу\n';
      code += '                if skip_target:\n';
      code += '                    try:\n';
      code += '                        logging.info(f"🚀 Переходим к узлу skipDataCollection медиа: {skip_target}")\n';
      code += '                        import types as aiogram_types\n';
      code += '                        fake_callback = aiogram_types.SimpleNamespace(\n';
      code += '                            id="skip_media_nav",\n';
      code += '                            from_user=message.from_user,\n';
      code += '                            chat_instance="",\n';
      code += '                            data=skip_target,\n';
      code += '                            message=message,\n';
      code += '                            answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
      code += '                        )\n';

      // Добавляем навигацию для skip_buttons медиа-узлов
      if (nodes.length > 0) {
        nodes.forEach((mediaSkipNode, mediaSkipIdx) => {
          const mediaSkipCond = mediaSkipIdx === 0 ? 'if' : 'elif';
          const mediaSkipFnName = mediaSkipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `                        ${mediaSkipCond} skip_target == "${mediaSkipNode.id}":\n`;
          code += `                            await handle_callback_${mediaSkipFnName}(fake_callback)\n`;
        });
        code += '                        else:\n';
        code += '                            logging.warning(f"Неизвестный целевой узел skipDataCollection медиа: {skip_target}")\n';
      }

      code += '                    except Exception as e:\n';
      code += '                        logging.error(f"Ошибка при переходе к узлу skipDataCollection медиа {skip_target}: {e}")\n';
      code += '                return\n';
      code += '    \n';
      /**
       * Универсальная система ожидания ввода
       * Проверяет состояние ожидания ввода и обрабатывает различные типы входных данных
       */
      code += '    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)\n';
      code += '    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]\n';
      code += '    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")\n';
      code += '    if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
      code += '        # Обрабатываем ввод через универсальную систему\n';
      code += '        waiting_config = user_data[user_id]["waiting_for_input"]\n';
      code += '        \n';
      code += '        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода\n';
      code += '        if not waiting_config:\n';
      code += '            return  # Состояние ожидания пустое, игнорируем\n';
      code += '        \n';
      
      /**
       * Обработка различных форматов конфигурации
       * Поддерживает новый формат (словарь) и старый формат (строка) для обратной совместимости
       */
      code += '        # Проверяем формат конфигурации - новый (словарь) или старый (строка)\n';
      code += '        if isinstance(waiting_config, dict):\n';
      code += '            # Новый формат - извлекаем данные из словаря\n';
      code += '            waiting_node_id = waiting_config.get("node_id")\n';
      code += '            input_type = waiting_config.get("type", "text")\n';
      code += '            variable_name = waiting_config.get("variable", "user_response")\n';
      code += '            save_to_database = waiting_config.get("save_to_database", False)\n';
      code += '            min_length = waiting_config.get("min_length", 0)\n';
      code += '            max_length = waiting_config.get("max_length", 0)\n';
      code += '            next_node_id = waiting_config.get("next_node_id")\n';
      code += '            \n';
      
      /**
       * Проверка типа ввода медиа
       * Если ожидается медиа-файл, текстовый обработчик должен проигнорировать сообщение
       */
      code += '            # ИСПРАВЛЕНИЕ: Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)\n';
      code += '            # Если да, то текстовый обработчик не должен его обрабатывать\n';
      code += '            if input_type in ["photo", "video", "audio", "document"]:\n';
      code += '                logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")\n';
      code += '                return\n';
      code += '        else:\n';
      code += '            # Старый формат - waiting_config это строка с node_id\n';
      code += '            waiting_node_id = waiting_config\n';
      code += '            input_type = user_data[user_id].get("input_type", "text")\n';
      code += '            variable_name = user_data[user_id].get("input_variable", "user_response")\n';
      code += '            save_to_database = user_data[user_id].get("save_to_database", False)\n';
      code += '            min_length = 0\n';
      code += '            max_length = 0\n';
      code += '            next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")\n';
      code += '        \n';
      code += '        user_text = message.text\n';
      code += '        \n';
      
      /**
       * Обработка кнопок skipDataCollection в универсальной системе
       * Проверяет нажатые кнопки и выполняет переход без сохранения данных
       */
      code += '        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n';
      code += '        if isinstance(waiting_config, dict):\n';
      code += '            skip_buttons = waiting_config.get("skip_buttons", [])\n';
      code += '            for skip_btn in skip_buttons:\n';
      code += '                if skip_btn.get("text") == user_text:\n';
      code += '                    skip_target = skip_btn.get("target")\n';
      code += '                    logging.info(f"⏭️ Нажата кнопка skipDataCollection в waiting_for_input: {user_text} -> {skip_target}")\n';
      code += '                    # Очищаем состояние ожидания\n';
      code += '                    if "waiting_for_input" in user_data[user_id]:\n';
      code += '                        del user_data[user_id]["waiting_for_input"]\n';
      code += '                    # Переходим к целевому узлу\n';
      code += '                    if skip_target:\n';
      code += '                        try:\n';
      code += '                            logging.info(f"🚀 Переходим к узлу skipDataCollection: {skip_target}")\n';
      code += '                            import types as aiogram_types\n';
      code += '                            fake_callback = aiogram_types.SimpleNamespace(\n';
      code += '                                id="skip_button_nav",\n';
      code += '                                from_user=message.from_user,\n';
      code += '                                chat_instance="",\n';
      code += '                                data=skip_target,\n';
      code += '                                message=message,\n';
      code += '                                answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
      code += '                            )\n';

      // Добавляем навигацию для кнопок skipDataCollection
      if (nodes.length > 0) {
        nodes.forEach((skipNode, skipIdx) => {
          const skipCond = skipIdx === 0 ? 'if' : 'elif';
          const skipFnName = skipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `                            ${skipCond} skip_target == "${skipNode.id}":\n`;
          code += `                                await handle_callback_${skipFnName}(fake_callback)\n`;
        });
        code += '                            else:\n';
        code += '                                logging.warning(f"Неизвестный целевой узел skipDataCollection: {skip_target}")\n';
      }

      code += '                        except Exception as e:\n';
      code += '                            logging.error(f"Ошибка при переходе к узлу skipDataCollection {skip_target}: {e}")\n';
      code += '                    return\n';
      /**
       * Валидация входных данных
       * Проверяет формат email, номера телефона, числовых значений
       * и ограничения по длине текста
       */
      code += '        \n';
      code += '        # Валидация для нового формата\n';
      code += '        if isinstance(waiting_config, dict):\n';
      
      /**
       * Валидация длины текста
       * Проверяет минимальную и максимальную длину введенного текста
       */
      code += '            # Валидация длины\n';
      code += '            if min_length > 0 and len(user_text) < min_length:\n';
      code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
      code += '                await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
      code += '                return\n';
      code += '            \n';
      code += '            if max_length > 0 and len(user_text) > max_length:\n';
      code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
      code += '                await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
      code += '                return\n';
      code += '            \n';
      
      /**
       * Валидация типа ввода
       * Проверяет соответствие введенных данных указанному типу (email, phone, number)
       */
      code += '            # Валидация типа ввода\n';
      code += '            if input_type == "email":\n';
      code += '                import re\n';
      code += '                email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
      code += '                if not re.match(email_pattern, user_text):\n';
      code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
      code += '                    await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
      code += '                    return\n';
      code += '            elif input_type == "number":\n';
      code += '                try:\n';
      code += '                    float(user_text)\n';
      code += '                except ValueError:\n';
      code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
      code += '                    await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
      code += '                    return\n';
      code += '            elif input_type == "phone":\n';
      code += '                import re\n';
      code += '                phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
      code += '                if not re.match(phone_pattern, user_text):\n';
      code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
      code += '                    await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
      code += '                    return\n';
      
      /**
       * Сохранение проверенных данных
       * Сохраняет валидированные данные в пользовательские данные и базу данных
       */
      code += '            \n';
      code += '            # Сохраняем ответ для нового формата\n';
      code += '            timestamp = get_moscow_time()\n';
      code += '            response_data = user_text\n';
      code += '            \n';
      code += '            # Сохраняем в пользовательские данные\n';
      code += '            user_data[user_id][variable_name] = response_data\n';
      code += '            \n';
      code += '            # Сохраняем в базу данных если включено\n';
      code += '            if save_to_database:\n';
      code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
      code += '                if saved_to_db:\n';
      code += '                    logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
      code += '                else:\n';
      code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
      code += '            \n';
      
      /**
       * Отправка подтверждающего сообщения
       * Отправляет пользователю сообщение об успешном сохранении данных
       */
      code += '            # Отправляем подтверждающее сообщение только если оно задано\n';
      code += '            success_message = waiting_config.get("success_message", "")\n';
      code += '            if success_message:\n';
      code += '                logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")\n';
      code += '                await message.answer(success_message)\n';
      code += '                logging.info(f"✅ Отправлено подтверждение: {success_message}")\n';
      code += '            \n';
      
      /**
       * Очистка состояния ожидания
       * Удаляет состояние ожидания ввода после успешной обработки
       */
      code += '            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией\n';
      code += '            if "waiting_for_input" in user_data[user_id]:\n';
      code += '                del user_data[user_id]["waiting_for_input"]\n';
      code += '            \n';
      code += '            logging.info(f"✅ Переход к следующему узлу выполнен успешно")\n';
      code += '            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
      code += '            \n';
      
      /**
       * Навигация к следующему узлу
       * Переходит к следующему узлу диалога с поддержкой автопереходов
       */
      code += '            # Навигация к следующему узлу для нового формата\n';
      code += '            if next_node_id:\n';
      code += '                try:\n';
      
      /**
       * Цикл автопереходов
       * Поддерживает последовательные переходы между узлами без участия пользователя
       */
      code += '                    # Цикл для поддержки автопереходов\n';
      code += '                    while next_node_id:\n';
      code += '                        logging.info(f"🚀 Переходим к узлу: {next_node_id}")\n';
      code += '                        current_node_id = next_node_id\n';
      code += '                        next_node_id = None  # Сбрасываем, будет установлен при автопереходе\n';
      code += '                        # Проверяем навигацию к узлам\n';

      // Функция для генерации отступов (решение архитектора)
      const getIndents = (baseLevel: number) => {
        const indent = (level: number) => '    '.repeat(level);
        return {
          whileIndent: indent(baseLevel), // 24 пробела - уровень while
          conditionIndent: indent(baseLevel), // 24 пробела - уровень if/elif
          bodyIndent: indent(baseLevel + 1), // 28 пробелов - тело if/elif
        };
      };

      const { whileIndent, conditionIndent, bodyIndent } = getIndents(6);

      // Добавляем навигацию для каждого узла
      if (nodes.length > 0) {
        nodes.forEach((targetNode, index) => {
          const condition = index === 0 ? 'if' : 'elif';
          code += `${conditionIndent}${condition} current_node_id == "${targetNode.id}":\n`;

          if (targetNode.type === 'message') {
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
            if (targetNode.data.allowMultipleSelection === true) {
              // Для узлов с множественным выбором создаем прямую навигацию
              const messageText = targetNode.data.messageText || 'Сообщение';
              const formattedText = formatTextForPython(messageText);
              code += `${bodyIndent}# Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
              code += `${bodyIndent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
              code += `${bodyIndent}text = ${formattedText}\n`;

              // Замена переменных
              code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
              code += generateUniversalVariableReplacement(bodyIndent);

              // Инициализируем состояние множественного выбора
              code += `${bodyIndent}# Инициализируем состояние множественного выбора\n`;
              code += `${bodyIndent}user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
              code += `${bodyIndent}user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
              code += `${bodyIndent}user_data[user_id]["multi_select_type"] = "selection"\n`;
              if (targetNode.data.multiSelectVariable) {
                code += `${bodyIndent}user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
              }

              // Создаем inline клавиатуру с кнопками выбора
              if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += generateInlineKeyboardCode(targetNode.data.buttons, bodyIndent, targetNode.id, targetNode.data, allNodeIds);
                code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += `${bodyIndent}await message.answer(text)\n`;
              }
              code += `${bodyIndent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
            } else {
              const messageText = targetNode.data.messageText || 'Сообщение';
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              code += `${bodyIndent}text = ${formattedText}\n`;

              // Применяем замену переменных
              code += `${bodyIndent}# Замена переменных в тексте\n`;
              code += generateUniversalVariableReplacement(bodyIndent);

              // Если узел message собирает ввод, настраиваем ожидание
              if (targetNode.data.collectUserInput === true) {
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
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
                code += `${bodyIndent}# Устанавливаем состояние ожидания ввода для узла ${targetNode.id}\n`;
                code += generateWaitingStateCode(targetNode, bodyIndent);
                code += `${bodyIndent}logging.info(f"✅ Узел ${targetNode.id} настроен для сбора ввода (collectUserInput=true)")\n`;

                // Если у узла есть кнопки, показываем их ВМЕСТЕ с ожиданием ввода
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += `${bodyIndent}# У узла есть inline кнопки - показываем их вместе с ожиданием ввода\n`;
                  code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                  // Добавляем кнопки для узла с collectUserInput + buttons
                  targetNode.data.buttons.forEach((btn: Button, btnIndex: number) => {
                    if (btn.action === "goto" && btn.target) {
                      const callbackData = `${btn.target}`;
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                    } else if (btn.action === "url" && btn.url) {
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                    } else if (btn.action === "command" && btn.target) {
                      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                    }
                  });

                  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                  code += `${bodyIndent}builder.adjust(${columns})\n`;
                  code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                  code += `${bodyIndent}logging.info(f"✅ Показаны inline кнопки для узла ${targetNode.id} с collectUserInput (ожидание ввода активно)")\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  // Проверяем, есть ли условные сообщения
                  if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                    code += `${bodyIndent}# Узел с условными сообщениями - проверяем условия\n`;
                    code += `${bodyIndent}logging.info(f"🔧 Обработка узла с условными сообщениями: ${targetNode.id}")\n`;
                    code += `${bodyIndent}user_data_dict = await get_user_from_db(user_id) or {}\n`;
                    code += `${bodyIndent}user_data_dict.update(user_data.get(user_id, {}))\n`;
                    code += `${bodyIndent}# Функция для проверки переменных пользователя\n`;
                    code += `${bodyIndent}def check_user_variable_inline(var_name, user_data_dict):\n`;
                    code += `${bodyIndent}    if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
                    code += `${bodyIndent}        try:\n`;
                    code += `${bodyIndent}            import json\n`;
                    code += `${bodyIndent}            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
                    code += `${bodyIndent}            if var_name in parsed_data:\n`;
                    code += `${bodyIndent}                raw_value = parsed_data[var_name]\n`;
                    code += `${bodyIndent}                if isinstance(raw_value, dict) and "value" in raw_value:\n`;
                    code += `${bodyIndent}                    var_value = raw_value["value"]\n`;
                    code += `${bodyIndent}                    if var_value is not None and str(var_value).strip() != "":\n`;
                    code += `${bodyIndent}                        return True, str(var_value)\n`;
                    code += `${bodyIndent}                else:\n`;
                    code += `${bodyIndent}                    if raw_value is not None and str(raw_value).strip() != "":\n`;
                    code += `${bodyIndent}                        return True, str(raw_value)\n`;
                    code += `${bodyIndent}        except (json.JSONDecodeError, TypeError):\n`;
                    code += `${bodyIndent}            pass\n`;
                    code += `${bodyIndent}    if var_name in user_data_dict:\n`;
                    code += `${bodyIndent}        variable_data = user_data_dict.get(var_name)\n`;
                    code += `${bodyIndent}        if isinstance(variable_data, dict) and "value" in variable_data:\n`;
                    code += `${bodyIndent}            var_value = variable_data["value"]\n`;
                    code += `${bodyIndent}            if var_value is not None and str(var_value).strip() != "":\n`;
                    code += `${bodyIndent}                return True, str(var_value)\n`;
                    code += `${bodyIndent}        elif variable_data is not None and str(variable_data).strip() != "":\n`;
                    code += `${bodyIndent}            return True, str(variable_data)\n`;
                    code += `${bodyIndent}    return False, None\n`;
                    code += `${bodyIndent}\n`;

                    // Генерируем проверку условий
                    code += `${bodyIndent}conditional_met = False\n`;

                    const sortedConditions = [...targetNode.data.conditionalMessages].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
                    sortedConditions.forEach((condition: any, condIndex: number) => {
                      const ifKeyword = condIndex === 0 ? 'if' : 'if';

                      if (condition.condition === 'user_data_exists' && condition.variableName) {
                        code += `${bodyIndent}${ifKeyword} (\n`;
                        code += `${bodyIndent}    check_user_variable_inline("${condition.variableName}", user_data_dict)[0]\n`;
                        code += `${bodyIndent}):\n`;
                        code += `${bodyIndent}    conditional_met = True\n`;

                        // Условная клавиатура
                        if (condition.buttons && condition.buttons.length > 0) {
                          code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;
                          condition.buttons.forEach((btn: Button) => {
                            code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                          });
                          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                          code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                          code += `${bodyIndent}    main_text = text\n`;
                          code += `${bodyIndent}    await message.answer(main_text, reply_markup=keyboard)\n`;

                          // Проверяем, нужно ли собирать ввод для условного сообщения
                          const condCollectInput = condition.collectUserInput === true || condition.waitForTextInput === true || condition.enableTextInput === true;
                          if (condCollectInput) {
                            code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НАСТРОЕН)")\n`;
                            code += `${bodyIndent}    # Настраиваем ожидание ввода для условного сообщения\n`;
                            const condInputVariable = condition.textInputVariable || condition.inputVariable || condition.variableName || targetNode.data.inputVariable || `response_${targetNode.id}`;
                            const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;

                            // ИСПРАВЛЕНИЕ: Собираем кнопки с skipDataCollection=true
                            const condSkipButtons = (condition.buttons || [])
                              .filter((btn: any) => btn.skipDataCollection === true && btn.target)
                              .map((btn: any) => ({ text: btn.text, target: btn.target }));
                            const condSkipButtonsJson = JSON.stringify(condSkipButtons);

                            code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                            code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                            code += `${bodyIndent}        "type": "text",\n`;
                            code += `${bodyIndent}        "variable": "${condInputVariable}",\n`;
                            code += `${bodyIndent}        "save_to_database": True,\n`;
                            code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                            code += `${bodyIndent}        "next_node_id": "${nextNodeAfterCondition || ''}",\n`;
                            code += `${bodyIndent}        "skip_buttons": ${condSkipButtonsJson}\n`;
                            code += `${bodyIndent}    }\n`;
                            code += `${bodyIndent}    logging.info(f"🔧 Установлено ожидание ввода для условного сообщения: {user_data[message.from_user.id]['waiting_for_input']}")\n`;
                          } else {
                            code += `${bodyIndent}    logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id} (сбор ответов НЕ настроен - кнопки ведут напрямую)")\n`;
                          }
                        }
                      }
                    });

                    // Если условие не выполнено - показываем основную клавиатуру
                    code += `${bodyIndent}if not conditional_met:\n`;
                    code += `${bodyIndent}    # Условие не выполнено - показываем основное сообщение\n`;
                    code += `${bodyIndent}    # ИСПяАВЛЕяИЕ: яя узла еять reply кнопки - показяваем их вместо ожидания тттекста\n`;
                    code += `${bodyIndent}    builder = ReplyKeyboardBuilder()\n`;

                    // Добавляем кнопки для reply клавиатуры
                    targetNode.data.buttons.forEach((btn: Button) => {
                      if (btn.action === "contact" && btn.requestContact) {
                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                      } else if (btn.action === "location" && btn.requestLocation) {
                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                      } else {
                        code += `${bodyIndent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                      }
                    });

                    const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                    const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                    code += `${bodyIndent}    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                    code += `${bodyIndent}    await message.answer(text, reply_markup=keyboard)\n`;
                    code += `${bodyIndent}    logging.info(f"✅ Показана основная reply клавиатура для узла ${targetNode.id}")\n`;

                    // Настройка ожидания ввода для основной клавиатуры
                    if (targetNode.data.enableTextInput === true || targetNode.data.collectUserInput === true) {
                      // ИСПРАВЛЕНИЕ: Используем массив modes для поддержки и кнопок и тттекста
                      const hasReplyButtons = targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0;
                      const modes: string[] = [];
                      if (hasReplyButtons) modes.push('button');
                      if (targetNode.data.enableTextInput === true || !hasReplyButtons) modes.push('text');
                      const modesStr = modes.map(m => `"${m}"`).join(', ');
                      const primaryType = modes[0];

                      code += `${bodyIndent}    # Настраиваем ожидание ввода для message узла с reply кнопками\n`;
                      code += `${bodyIndent}    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
                      code += `${bodyIndent}    user_data[message.from_user.id]["waiting_for_input"] = {\n`;
                      code += `${bodyIndent}        "type": "${primaryType}",\n`;
                      code += `${bodyIndent}        "modes": [${modesStr}],\n`;
                      code += `${bodyIndent}        "variable": "${inputVariable}",\n`;
                      code += `${bodyIndent}        "save_to_database": True,\n`;
                      code += `${bodyIndent}        "node_id": "${targetNode.id}",\n`;
                      code += `${bodyIndent}        "next_node_id": "${inputTargetNodeId}",\n`;
                      code += `${bodyIndent}        "min_length": 0,\n`;
                      code += `${bodyIndent}        "max_length": 0,\n`;
                      code += `${bodyIndent}        "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
                      code += `${bodyIndent}        "success_message": ""\n`;
                      code += `${bodyIndent}    }\n`;
                      const modesForLog = modes.map(m => `'${m}'`).join(', ');
                      code += `${bodyIndent}    logging.info(f"✅ Состояние ожидания настроено: modes=[${modesForLog}] для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
                    }
                  } else {
                    // Нет условных сообщений - стандартная обработка
                    code += `${bodyIndent}# ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания тттекста\n`;
                    code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                    // Добавляем кнопки для reply клавиатуры
                    targetNode.data.buttons.forEach((btn: Button) => {
                      if (btn.action === "contact" && btn.requestContact) {
                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                      } else if (btn.action === "location" && btn.requestLocation) {
                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                      } else {
                        code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                      }
                    });

                    const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                    const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                    code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                    code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                    code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для узла ${targetNode.id} с collectUserInput")\n`;

                    // ИСПРАВЛЕНИЕ: Если включен сбор ввода, настраиваем ожидание даже при наличии кнопок
                    if (targetNode.data.enableTextInput === true || targetNode.data.enablePhotoInput === true ||
                      targetNode.data.enableVideoInput === true || targetNode.data.enableAudioInput === true ||
                      targetNode.data.enableDocumentInput === true || targetNode.data.collectUserInput === true) {
                      code += `${bodyIndent}# Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)\n`;
                      code += generateWaitingStateCode(targetNode, bodyIndent);
                    }
                  }
                } else {
                  code += `${bodyIndent}await message.answer(text)\n`;

                  // Настраиваем ожидание ввода ТОЛЬКО если нет кнопок (используем универсальную функцию)
                  code += `${bodyIndent}# Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)\n`;
                  code += generateWaitingStateCode(targetNode, bodyIndent);
                }
              } else {
                // Если узел не собирает ввод, проверяем есть ли inline или reply кнопки
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += `${bodyIndent}# Создаем inline клавиатуру\n`;
                  code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

                  // Добавляем кнопки
                  targetNode.data.buttons.forEach((btn: Button, btnIndex: number) => {
                    if (btn.action === "goto" && btn.target) {
                      const callbackData = `${btn.target}`;
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                    } else if (btn.action === "url" && btn.url) {
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
                    } else if (btn.action === "command" && btn.target) {
                      // КРИТИЧяяСКОЕ ИСПРАВЛЕНИЕ: Добавляем яоддержку кнопок команд
                      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                      code += `${bodyIndent}logging.info(f"Создана кнопка команды: ${btn.text} -> ${commandCallback}")\n`;
                      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                    }
                  });

                  // ВОССТАНОВЛЕНИЕ: Добавляем умное расположение кнопок по колонкам
                  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                  code += `${bodyIndent}builder.adjust(${columns})\n`;
                  code += `${bodyIndent}keyboard = builder.as_markup()\n`;
                  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += `${bodyIndent}# Создаем reply клавиатуру\n`;
                  code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

                  // Добавляем кнопки для reply клавиатуры
                  targetNode.data.buttons.forEach((btn: Button) => {
                    if (btn.action === "contact" && btn.requestContact) {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                    } else if (btn.action === "location" && btn.requestLocation) {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                    } else {
                      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                    }
                  });

                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
                  code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для переходного узла")\n`;
                } else {
                  code += `${bodyIndent}await message.answer(text)\n`;
                }

                // Очищаем состояние ожидания ввода после успешного перехода для message узлов без сбора ввода
                if (!targetNode.data.collectUserInput) {
                  code += `${bodyIndent}# НЕ отправляем сообщение об успехе здесь - это делается в старом формате\n`;
                  code += `${bodyIndent}# Очищаем сястояние ожидания ввода после уяпеянояо перехода\n`;
                  code += `${bodyIndent}if "waiting_for_input" in user_data[user_id]:\n`;
                  code += `${bodyIndent}    del user_data[user_id]["waiting_for_input"]\n`;
                  code += `${bodyIndent}\n`;
                  code += `${bodyIndent}logging.info("✅ Переход к следующему уялу выполнен успешно")\n`;
                }

                // АВТОПЕРЕХОД: Если у узля есть autoTransitionTo, сразу вызываем callback обработчик
                if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                  // Проверяяям, нужно ли выполнять автопереход - только если collectUserInput=true
                  if (targetNode.data.collectUserInput !== false) {
                    const autoTargetId = targetNode.data.autoTransitionTo;
                    const autoSafeFunctionName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                    code += `${bodyIndent}\n`;
                    code += `${bodyIndent}# ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)\n`;
                    code += `${bodyIndent}logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                    code += `${bodyIndent}import types as aiogram_types\n`;
                    code += `${bodyIndent}async def noop(*args, **kwargs):\n`;
                    code += `${bodyIndent}    return None\n`;
                    code += `${bodyIndent}fake_message = aiogram_types.SimpleNamespace(\n`;
                    code += `${bodyIndent}    chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
                    code += `${bodyIndent}    message_id=message.message_id,\n`;
                    code += `${bodyIndent}    delete=noop,\n`;
                    code += `${bodyIndent}    edit_text=noop,\n`;
                    code += `${bodyIndent}    answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)\n`;
                    code += `${bodyIndent})\n`;
                    code += `${bodyIndent}fake_callback = aiogram_types.SimpleNamespace(\n`;
                    code += `${bodyIndent}    id="auto_transition",\n`;
                    code += `${bodyIndent}    from_user=message.from_user,\n`;
                    code += `${bodyIndent}    chat_instance="",\n`;
                    code += `${bodyIndent}    data="${autoTargetId}",\n`;
                    code += `${bodyIndent}    message=fake_message,\n`;
                    code += `${bodyIndent}    answer=noop\n`;
                    code += `${bodyIndent})\n`;
                    code += `${bodyIndent}await handle_callback_${autoSafeFunctionName}(fake_callback)\n`;
                  } else {
                    code += `${bodyIndent}# Автопереход пропущен: collectUserInput=false\n`;
                    code += `${bodyIndent}logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                    code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
                  }
                } else {
                  code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
                }
              }
            } // Закрываем блок else для allowMultipleSelection
          } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
            const inputPrompt = formatTextForPython(targetNode.data.messageText || "Введите ваш ответ:");
            code += `${bodyIndent}prompt_text = ${inputPrompt}\n`;
            code += `${bodyIndent}await message.answer(prompt_text)\n`;

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяяям collectUserInput перед установкой waiting_for_input
            const msgNodeCollectInput = targetNode.data.collectUserInput === true ||
              targetNode.data.enableTextInput === true ||
              targetNode.data.enablePhotoInput === true ||
              targetNode.data.enableVideoInput === true ||
              targetNode.data.enableAudioInput === true ||
              targetNode.data.enableDocumentInput === true;

            if (msgNodeCollectInput) {
              code += `${bodyIndent}# Устанавливаея нояяое ожидание ввода (collectUserInput=true)\n`;
              code += `${bodyIndent}user_data[user_id]["waiting_for_input"] = {\n`;
              code += `${bodyIndent}    "type": "${targetNode.data.inputType || 'text'}",\n`;
              code += `${bodyIndent}    "variable": "${targetNode.data.inputVariable || 'user_response'}",\n`;
              code += `${bodyIndent}    "save_to_database": True,\n`;
              code += `${bodyIndent}    "node_id": "${targetNode.id}",\n`;
              const nextConnection = connections.find(conn => conn.source === targetNode.id);
              if (nextConnection) {
                code += `${bodyIndent}    "next_node_id": "${nextConnection.target}",\n`;
              } else {
                code += `${bodyIndent}    "next_node_id": None,\n`;
              }
              code += `${bodyIndent}    "min_length": ${targetNode.data.minLength || 0},\n`;
              code += `${bodyIndent}    "max_length": ${targetNode.data.maxLength || 0},\n`;
              code += `${bodyIndent}    "retry_message": "Пожаляйста, попробуйте еще раз.",\n`;
              code += `${bodyIndent}    "success_message": ""\n`;
              code += `${bodyIndent}}\n`;
            } else {
              code += `${bodyIndent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
            }
            code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;
          } else if (targetNode.type === 'command') {
            // Для узлов команд яызываем соответствующий обработчик
            const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
            const handlerName = `${commandName}_handler`;
            code += `${bodyIndent}# Выполняяем команду ${targetNode.data.command}\n`;
            code += `${bodyIndent}from types import SimpleNamespace\n`;
            code += `${bodyIndent}fake_message = SimpleNamespace()\n`;
            code += `${bodyIndent}fake_message.from_user = message.from_user\n`;
            code += `${bodyIndent}fake_message.chat = message.chat\n`;
            code += `${bodyIndent}fake_message.date = message.date\n`;
            code += `${bodyIndent}fake_message.answer = message.answer\n`;
            code += `${bodyIndent}await ${handlerName}(fake_message)\n`;
            code += `${bodyIndent}break  # Выходим из цикла после вяполяеняя команды\n`;
          } else {
            code += `${bodyIndent}logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
            code += `${bodyIndent}break  # Выходим из цикла для неизвестного типа узла\n`;
          }
        });

        code += '                        else:\n';
        code += '                            logging.warning(f"Неизвестный узел: {current_node_id}")\n';
        code += '                            break  # Выходим из цикла при неизвестном узле\n';
      } else {
        code += '                        # No nodes available for navigation\n';
        code += '                        logging.warning(f"Нет доступных узлов для навигации")\n';
        code += '                        break\n';
      }

      code += '                except Exception as e:\n';
      code += '                    logging.error(f"Ошибка при переходе к узлу: {e}")\n';
      code += '            \n';
      code += '            return  # Завершаем обработку для нового формата\n';
      code += '        \n';
      code += '        # Обработка старого формата (для совместимости)\n';
      code += '        # Находим узел для получения настроек\n';

      // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
      const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
      code += `        logging.info(f"DEBUG old format: checking inputNodes: ${inputNodes.map(n => n.id).join(', ')}")\n`;
      inputNodes.forEach((node, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `        ${condition} waiting_node_id == "${node.id}":\n`;

        // Добавляем валидацию если есть
        if (node.data.inputValidation) {
          if (node.data.minLength && node.data.minLength > 0) {
            code += `            if len(user_text) < ${node.data.minLength}:\n`;
            code += `                await message.answer("❌ Слишком короткий ответ (минимум ${node.data.minLength} символов). Попробуйте еще раз.")\n`;
            code += `                return\n`;
          }
          if (node.data.maxLength && node.data.maxLength > 0) {
            code += `            if len(user_text) > ${node.data.maxLength}:\n`;
            code += `                await message.answer("❌ Слишком длинный ответ (максимум ${node.data.maxLength} символов). Попробуйте еще раз.")\n`;
            code += `                return\n`;
          }
        }

        // Валидация типа ввода
        if (node.data.inputType === 'email') {
          code += `            import re\n`;
          code += `            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n`;
          code += `            if not re.match(email_pattern, user_text):\n`;
          code += `                await message.answer("❌ Неверный формат email. Попробуйте еще раз.")\n`;
          code += `                return\n`;
        } else if (node.data.inputType === 'number') {
          code += `            try:\n`;
          code += `                float(user_text)\n`;
          code += `            except ValueError:\n`;
          code += `                await message.answer("❌ Введите корректное число. Попробуйте еще раз.")\n`;
          code += `                return\n`;
        } else if (node.data.inputType === 'phone') {
          code += `            import re\n`;
          code += `            phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n`;
          code += `            if not re.match(phone_pattern, user_text):\n`;
          code += `                await message.answer("❌ Неверный формат телефона. Попробуйте еще раз.")\n`;
          code += `                return\n`;
        }

        // Сохранение ответа
        const variableName = node.data.inputVariable || 'user_response';
        code += `            \n`;
        code += `            # Сохраняем ответ пользователя\n`;
        code += `            import datetime\n`;
        code += `            timestamp = get_moscow_time()\n`;
        code += `            \n`;
        code += `            # Сохраняем простое значение для совместимости с логикой профиля\n`;
        code += `            response_data = user_text  # Простое значение вместо сложного объекта\n`;
        code += `            \n`;
        code += `            # Сохраняем в пользовательские данные\n`;
        code += `            user_data[user_id]["${variableName}"] = response_data\n`;
        code += `            \n`;

        // Сохранение в базу данных (всегда включено для collectUserInput)
        code += `            # Сохраняем в базу данных\n`;
        code += `            saved_to_db = await update_user_data_in_db(user_id, "${variableName}", response_data)\n`;
        code += `            if saved_to_db:\n`;
        code += `                logging.info(f"✅ Данные сохранены в БД: ${variableName} = {user_text} (пользователь {user_id})")\n`;
        code += `            else:\n`;
        code += `                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
        code += `            \n`;

        code += `            \n`;
        code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}")\n`;
        code += `            \n`;

        // Навигация к следующему узлу
        if (node.data.inputTargetNodeId) {
          code += `            # Переходим к следующему узлу\n`;
          code += `            try:\n`;

          // Найдем целевой узел для навигации
          const targetNode = nodes.find(n => n.id === node.data.inputTargetNodeId);
          if (targetNode) {
            if (targetNode.type === 'message') {
              // Для message узлов отправляем сообщение напрямую
              const messageText = targetNode.data.messageText || 'Выберите действие';
              const formattedText = formatTextForPython(messageText);
              code += `                # Отправляем сообщение для узла ${targetNode.id}\n`;
              code += `                text = ${formattedText}\n`;

              // Если целевой узел тоже собирает ввод, настраиваем новое ожидание
              if (targetNode.data.collectUserInput === true) {
                const nextInputType = targetNode.data.inputType || 'text';
                const nextInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const nextInputTargetNodeId = targetNode.data.inputTargetNodeId;

                code += `                # Настраиваем новое ожидание ввода для узла ${targetNode.id}\n`;
                code += `                user_data[user_id]["waiting_for_input"] = {\n`;
                code += `                    "type": "${nextInputType}",\n`;
                code += `                    "variable": "${nextInputVariable}",\n`;
                code += `                    "save_to_database": True,\n`;
                code += `                    "node_id": "${targetNode.id}",\n`;
                code += `                    "next_node_id": "${nextInputTargetNodeId || ''}",\n`;
                code += `                    "min_length": 0,\n`;
                code += `                    "max_length": 0,\n`;
                code += `                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
                code += `                    "success_message": ""\n`;
                code += `                }\n`;
                code += `                \n`;
              }

              if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                // Используем универсальную функцию для создания inline клавиатуры
                code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                code += `                await message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += `                await message.answer(text)\n`;
              }

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем состояние ТОЛЬКО если целевой узел НЕ собирает ввод
              if (!targetNode.data.collectUserInput) {
                code += `                # Очищаем состояние ожидания ввода после успешного перехода\n`;
                code += `                if "waiting_for_input" in user_data[user_id]:\n`;
                code += `                    del user_data[user_id]["waiting_for_input"]\n`;
                if (node.data.inputType) {
                  code += `                if "input_type" in user_data[user_id]:\n`;
                  code += `                    del user_data[user_id]["input_type"]\n`;
                }
              }
              code += `                \n`;
              code += `                logging.info("✅ Переход к следующему узлу выполнен успешно")\n`;
            } else {
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
              if (targetNode.data.allowMultipleSelection === true) {
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

                // Создаем inline клавиатуру с кнопками выбора
                if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                  code += `                await message.answer(text, reply_markup=keyboard)\n`;
                } else {
                  code += `                await message.answer(text)\n`;
                }
                code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
              } else {
                // Для обычных узлов используем обычную навигацию
                const messageText = targetNode.data.messageText || 'Сообщение';
                const formattedText = formatTextForPython(messageText);
                code += `                # Обычный узел - отправляем сообщение\n`;
                code += `                text = ${formattedText}\n`;

                // Добавляем замену переменных
                code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                code += generateUniversalVariableReplacement('                ');

                // Создаем inline клавиатуру если есть кнопки
                if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
                  code += `                await message.answer(text, reply_markup=keyboard)\n`;
                } else {
                  code += '                await message.answer(text)\n';
                }
                code += `                logging.info(f"✅ Ввод навигация к обычному узлу: ${targetNode.id}")\n`;
              }
            }
          } else {
            // Если целевой узел не найден, добавляем заглушку
            code += `                logging.warning(f"Целевой узел {node.data.inputTargetNodeId} не найден")\n`;
            code += `                await message.answer("❌ Ошибка перехода: целевой узел не найден")\n`;
          }

          code += `            except Exception as e:\n`;
          code += `                logging.error(f"Ошябка при переходе к следующему узлу: {e}")\n`;
          code += `            return\n`;
        } else {
          // Если inputTargetNodeId равен null, это конец цепочки - это нормально
          code += `            # Конец цепочки ввода - завершаем обработку\n`;
          code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
          code += `            return\n`;
        }
      });

      generateAdHocInputCollectionHandler();

      // Добавляем навигацию к целевому узлу
      const navigationCode = generateContinuationLogicForButtonBasedInput();
      // Генерируем обработчики для медиа-файлов
      if (hasPhotoInput(nodes || [])) {
        let photoCode = generatePhotoHandlerCode();
        photoCode = photoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += photoCode;
      }
      if (hasVideoInput(nodes || [])) {
        let videoCode = generateVideoHandlerCode();
        videoCode = videoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += videoCode;
      }
      if (hasAudioInput(nodes || [])) {
        let audioCode = generateAudioHandlerCode();
        audioCode = audioCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += audioCode;
      }
      if (hasDocumentInput(nodes || [])) {
        let docCode = generateDocumentHandlerCode();
        docCode = docCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += docCode;
      }


      generateUserInputValidationAndContinuationLogic();

      // Генерируем логику навигации для каждого типа узла
      generateStateTransitionAndRenderLogic();
    }
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
          targetNode.data.buttons.forEach((button: Button, buttonIndex: number) => {
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
    code += '        raise KeyboardInterrupt()\n';
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
      code += '            print("🔌 Соединение с базой данных закрыто")\n';
    }
    code += '        \n';
    code += '        # Закрываем сессию бота\n';
    code += '        await bot.session.close()\n';
    code += '        print("🔌 Сессия бота закрыта")\n';
    code += '        print("✅ Бот корректно завершил работу")\n\n';
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
   * 5. Обработка прикрепленных медиа и различных типов контента
   * 6. Управление состоянием ожидания пользовательского ввода
   * 7. Обработка специальных медиа-узлов (стикеры, голос, анимации, локация, контакты)
   * 8. Обработка узлов пользовательского ввода с валидацией
   * 9. Обработка start узлов - начальные сообщения
   * 10. Обработка command узлов - выполнение команд
   * 11. Универсальный обработчик для остальных типов узлов
   * 12. Fallback обработка кнопок без настроенной цели
   * 13. Обработка кнопок с действием 'command' - создание обработчиков для выполнения команд
   */
  function processNodeButtonsAndGenerateHandlers(processedCallbacks: Set<string>) {
    inlineNodes.forEach(node => {
      node.data.buttons.forEach((button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }) => {
        if (button.action === 'goto' && button.id) {
          const callbackData = button.id; // Используем идентификатор кнопки как callback_data

          /**
           * БЛОК 1: Обработка кнопок с действием 'goto'
           * Создает обработчики для навигации между узлами бота
           * Проверяет дублирование callback_data для оптимизации
           */
          
          // Избегаем дублирования обработчиков для идентификаторов кнопок (не целевых идентификаторов)
          if (processedCallbacks.has(callbackData)) return;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Избегаем дублированных обработчиков для target узлов
          if (button.target && processedCallbacks.has(button.target)) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }

          // Находим целевой узел (может быть null если нет target)
          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;

          // Создаем обработчик для каждой кнопки используя target как callback_data
          const actualCallbackData = button.target || callbackData;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем target узел перед созданием обработчика
          if (button.target && processedCallbacks.has(button.target)) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }

          // Отмечаем этот идентификатор кнопки как обработанный
          processedCallbacks.add(callbackData);

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем target в processedCallbacks СРАЗУ, чтобы избежать дублирования
          if (button.target) {
            processedCallbacks.add(button.target);
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
          }

          // ОТЛАДКА: Проверяем если это interests_result или metro_selection
          if (button.target === 'interests_result') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для interests_result в основном цикле');
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }
          if (button.target === 'metro_selection') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для metro_selection в основном цикле');
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }

          /**
           * БЛОК 2: Обработка множественного выбора
           * Определяет необходимость создания обработчика для кнопки "Готово"
           * при множественном выборе опций пользователем
           */
          
          // Если целевой узел имеет множественный выбор, добавляем обработку кнопки "done_"
          const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
          const shortNodeIdForDone = isDoneHandlerNeeded ? actualCallbackData.slice(-10).replace(/^_+/, '') : '';

          // ЛОГИРОВАНИЕ: Отслеживаем создание обработчиков для interests_result
          if (actualCallbackData === 'interests_result') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: Создаем обработчик для interests_result!');
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР: Текущие processedCallbacks:', Array.from(processedCallbacks));
          }

          if (isDoneHandlerNeeded) {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_") or c.data == "multi_select_done_${shortNodeIdForDone}")\n`;
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавлен обработчик кнопки "multi_select_done_${shortNodeIdForDone}" для узла ${actualCallbackData}`);
          } else {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
          }
          // Создаем безопасное имя функции на основе target или button ID
          const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');

          if (actualCallbackData === 'interests_result') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log('🚨 ГЕНЕРАТОР: Создаем функцию handle_callback_interests_result в ОСНОВНОМ ЦИКЛЕ');
          }

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
          code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных кнопок\n`;
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

          // Добавляем обработку кнопки "done_" для множественного выбора
          if (isDoneHandlerNeeded) {
            code += '    # Проверяем, является ли это кнопкой "Готово" для множественного выбора\n';
            code += `    if callback_data == "multi_select_done_${shortNodeIdForDone}":\n`;
            code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
            code += '        \n';

            // Сохраняем выбранные значения в базу данных
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            code += '        # Сохраняем выбранные значения в базу данных\n';
            code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
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
            code += `            logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
            code += '        \n';

            // Очищаем состояние множественного выбора
            code += '        # Очищаем состояние множественного выбора\n';
            code += '        if user_id in user_data:\n';
            code += `            user_data[user_id].pop("multi_select_${actualCallbackData}", None)\n`;
            code += '            user_data[user_id].pop("multi_select_node", None)\n';
            code += '            user_data[user_id].pop("multi_select_type", None)\n';
            code += '            user_data[user_id].pop("multi_select_variable", None)\n';
            code += '        \n';

            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;

              // КРИТИЧЕСКАЯ ОТЛАДКА
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР CONTINUEBUTTON DEBUG:`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: targetNode.id = "${targetNode.id}"`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: targetNode.data.continueButtonTarget = "${targetNode.data.continueButtonTarget}"`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: nextNodeId = "${nextNodeId}"`);
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🚨 ГЕНЕРАТОР: actualCallbackData = "${actualCallbackData}"`);

              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += `        logging.info(f"🚀 DEBUG: targetNode.id=${targetNode.id}, continueButtonTarget=${targetNode.data.continueButtonTarget}, nextNodeId=${nextNodeId}")\n`;

              // ИСПРАВЛЕНИЕ: Специальная логика для metro_selection -> interests_result
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Проверяем metro_selection -> interests_result: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              if (targetNode.id.includes('metro_selection') && nextNodeId === 'interests_result') {
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ Применяем специальную логику metro_selection -> interests_result`);
                code += '        # ИСПРАВЛЕНИЕ: Сохраняем метро выбор и устанавливаем флаг для показа клавиатуры\n';
                code += `        selected_metro = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
                code += '        if user_id not in user_data:\n';
                code += '            user_data[user_id] = {}\n';
                code += '        user_data[user_id]["saved_metro_selection"] = selected_metro\n';
                code += '        user_data[user_id]["show_metro_keyboard"] = True\n';
                code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: targetNode.id={targetNode.id}, nextNodeId={nextNodeId}")\n';
                code += '        logging.info(f"🚇 Сохранили метро выбор: {selected_metro}, установлен флаг show_metro_keyboard=True")\n';
                code += '        \n';
              } else {
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ❌ Не применяем специальную логику: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              }

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

          // Специальная обработка для кнопок "Изменить выбор" и "Начать заново"
          // Эти кнопки должны обрабатываться как обычные goto кнопки к start узлу
          // Правильная логика сохранения переменной на основе кнопки
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';

          // Определяем переменную для сохранения на основе родительского узла
          const parentNode = node; // Используем текущий узел как родительский


          // Проверяем настройку skipDataCollection для кнопки
          const shouldSkipDataCollection = button.skipDataCollection === true;

          if (!shouldSkipDataCollection) {
            if (parentNode && parentNode.data.inputVariable) {
              const variableName = parentNode.data.inputVariable;

              // Используем текст кнопки как значение переменной
              const variableValue = 'button_text';

              // Сохраняем переменную (если кнопка не имеет флага skipDataCollection, она сохраняется как обычное значение)
              code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
              code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
              code += '    \n';

              // КРИТИЧЕСКИ ВАЖНО: Очищаем состояние ожидания после сохранения переменной
              code += '    # Очищаем состояние ожидания ввода для этой переменной\n';
              code += '    if user_id in user_data:\n';
              code += '        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные\n';
              code += '        if "waiting_for_input" in user_data[user_id]:\n';
              code += `            if user_data[user_id]["waiting_for_input"] == "${parentNode.id}":\n`;
              code += '                del user_data[user_id]["waiting_for_input"]\n';
              code += `                logging.info(f"Состояние ожидания ввода очищено для переменной ${variableName} (пользователь {user_id})")\n`;
              code += '    \n';
            } else {
              // Резервный вариант: сохраняем кнопку как есть
              code += '    # Сохраняем кнопку в базу данных\n';
              code += '    timestamp = get_moscow_time()\n';
              code += '    response_data = button_text  # Простое значение\n';
              code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
              code += '    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")\n';
            }
          } else {
            code += '    # Кнопка настроена для пропуска сбора данных (skipDataCollection=true)\n';
            code += `    logging.info(f"Кнопка пропущена: {button_text} (не сохраняется из-за skipDataCollection)")\n`;
            code += '    # Устанавливаем флаг, чтобы следующий узел не сохранил переменную\n';
            code += '    user_data[user_id]["skipDataCollectionTransition"] = True\n';
          }
          code += '    \n';

          if (targetNode) {

            /**
             * БЛОК 3: Обработка различных типов целевых узлов
             * Генерирует специфичный код для каждого типа узла:
             * - message: текстовые сообщения с кнопками
             * - sticker: отправка стикеров
             * - voice: голосовые сообщения
             * - animation: анимации/GIF
             * - location: геолокация
             * - contact: контактная информация
             * - user-input: сбор пользовательского ввода
             * - start: начальное сообщение
             * - command: выполнение команд
             */

            // Обрабатываем узла сообщений с действием сохранения переменной
            if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
              const action = targetNode.data.action || 'none';
              const variableName = targetNode.data.variableName || '';
              const variableValue = targetNode.data.variableValue || '';
              const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';

              if (action === 'save_variable' && variableName && variableValue) {
                code += `    # Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
                code += `    user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
                code += `    await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
                code += `    logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
                code += '    \n';

                if (successMessage.includes('\n')) {
                  code += `    success_text = """${successMessage}"""\n`;
                } else {
                  const escapedMessage = successMessage.replace(/"/g, '\\"');
                  code += `    success_text = "${escapedMessage}"\n`;
                }

                // Добавляем замену переменных в сообщении об успехе
                code += `    # Подставляем значения переменных в текст сообщения\n`;
                code += `    if "{${variableName}}" in success_text:\n`;
                code += `        success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;

                code += '    await callback_query.message.edit_text(success_text)\n';
              }
            }

            // Обрабатываем обычные узла сообщений (например, source_friends, source_search и т.д.)
            else if (targetNode.type === 'message') {
              const messageText = targetNode.data.messageText || "Сообщение";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);

              code += `    # Отправляем сообщение для узла ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;

              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');

              /**
               * БЛОК 4: Поддержка условных сообщений
               * Позволяет показывать разные сообщения на основе данных пользователя
               * и настроенных условий в узле
               */
              
              // Добавляем поддержку условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';

                // Используем условное сообщение, если доступно, иначе используем стандартное
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
                code += '    if "conditional_keyboard" not in locals():\n';
                code += '        conditional_keyboard = None\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }

              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем тип клавиатуры и генерируем правильный код
              const hasButtons = targetNode.data.buttons && targetNode.data.buttons.length > 0;
              const keyboardType = targetNode.data.keyboardType;

              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} - кнопок: ${targetNode.data.buttons?.length}, keyboardType: ${keyboardType}`);

              if (hasButtons) {
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                if (keyboardType === "inline") {
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ INLINE клавиатуру для узла ${targetNode.id}`);
                  code += '        # Создаем inline клавиатуру\n';
                  const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                  code += keyboardCode;
                } else if (keyboardType === "reply") {
                  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ REPLY клавиатуру для узла ${targetNode.id}`);
                  code += '        # Создаем reply клавяатуру\n';
                  const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data);
                  code += keyboardCode;
                }
              }

              // Добавляем настройку ожидаяия текстового ввода для условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Настраиваем ожидание текстового ввода для условных сообщений\n';
                code += '    if "conditional_message_config" in locals():\n';
                code += '        # Проверяем, включено ли ожидание текстового ввода\n';
                code += '        wait_for_input = conditional_message_config.get("wait_for_input", False)\n';
                code += '        if wait_for_input:\n';
                code += '            # Получаем следующий узел из условного сообщения или подключений\n';
                code += '            conditional_next_node = conditional_message_config.get("next_node_id")\n';
                code += '            if conditional_next_node:\n';
                code += '                next_node_id = conditional_next_node\n';
                code += '            else:\n';
                const currentNodeConnections = connections.filter(conn => conn.source === targetNode.id);
                if (currentNodeConnections.length > 0) {
                  const nextNodeId = currentNodeConnections[0].target;
                  code += `                next_node_id = "${nextNodeId}"\n`;
                } else {
                  code += '                next_node_id = None\n';
                }
                code += '            \n';
                code += '            # Получаем переменную яля сохранения ввода\n';
                code += '            input_variable = conditional_message_config.get("input_variable")\n';
                code += '            if not input_variable:\n';
                code += '                input_variable = f"conditional_response_{conditional_message_config.get(\'condition_id\', \'unknown\')}"\n';
                code += '            \n';
                code += '            # ястанавливаем сястояние ожидания текстового ввода\n';
                code += '            if user_id not in user_data:\n';
                code += '                user_data[user_id] = {}\n';
                code += '            user_data[user_id]["waiting_for_conditional_input"] = {\n';
                code += '                "node_id": callback_query.data,\n';
                code += '                "condition_id": conditional_message_config.get("condition_id"),\n';
                code += '                "next_node_id": next_node_id,\n';
                code += '                "input_variable": input_variable,\n';
                code += '                "source_type": "conditional_message"\n';
                code += '            }\n';
                code += '            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")\n';
                code += '    \n';
              }

              /**
               * БЛОК 5: Обработка прикрепленных медиа
               * Проверяет наличие attachedMedia в узле и генерирует
               * соответствующий код для отправки медиафайлов
               */
              
              // Отправляем сообщение с учетом всех условий
              // Проверяем наличие прикяепленных медиа
              const attachedMedia = targetNode.data.attachedMedia || [];

              if (attachedMedia.length > 0) {
                if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} ямеет attachedMedia:`, attachedMedia);
                // Генерируям код отправки с медиа
                const parseModeStr = targetNode.data.formatMode || '';
                const keyboardStr = 'keyboard if keyboard is not None else None';
                // Определяем, собирает ли узел ввод (учитываем все типы ввода)
                const collectUserInputFlag = targetNode.data.collectUserInput !== false ||
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
                  targetNode.id,
                  '    ',
                  targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo ? targetNode.data.autoTransitionTo : undefined,
                  collectUserInputFlag
                );

                if (mediaCode) {
                  code += '    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового\n';
                  code += '    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:\n';
                  code += '        try:\n';
                  code += '            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])\n';
                  code += '            logging.info(f"🗑️ Reply сообщение удалено перед отправкой новогя")\n';
                  code += '            del user_data[user_id]["_delete_reply_message_id"]\n';
                  code += '        except Exception as e:\n';
                  code += '            logging.debug(f"Не удалось удалить reply сообщение: {e}")\n';
                  code += '    \n';
                  code += '    # Отправляем сообщение (с пяяоверкой прякрепленного медиа)\n';
                  code += mediaCode;
                } else {
                  // Резервный вариант яясли не удалось сгенерировать код медиа
                  code += '    # Отправляем сообщение (обычное)\n';
                  const autoFlag1 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
                  code += `    await safe_edit_or_send(callback_query, text, node_id="${targetNode.id}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag1}${parseMode})\n`;

                  // АВТОПЕРЕХОД для fallback случая
                  if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                    const autoTargetId = targetNode.data.autoTransitionTo;
                    const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                    code += `    # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                    code += `    logging.info(f"⚡ Автопереход от язла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                    code += `    await handle_node_${safeAutoTargetId}(callback_query)\n`;
                    code += `    return\n`;
                  }
                }
              } else {
                // Обычное сообщение без медиа
                code += '    # КРИТИЧНО: Удаляем reply сообщение ПЕРЕД отправкой нового\n';
                code += '    if user_id in user_data and "_delete_reply_message_id" in user_data[user_id]:\n';
                code += '        try:\n';
                code += '            await bot.delete_message(user_id, user_data[user_id]["_delete_reply_message_id"])\n';
                code += '            logging.info(f"🗑️ Reply сообщение удалено перед отправкой нового")\n';
                code += '            del user_data[user_id]["_delete_reply_message_id"]\n';
                code += '        except Exception as e:\n';
                code += '            logging.debug(f"Не удалось удалить reply сообщение: {e}")\n';
                code += '    \n';
                code += '    # Отправляем сообщение\n';
                const autoFlag2 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
                code += `    await safe_edit_or_send(callback_query, text, node_id="${targetNode.id}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag2}${parseMode})\n`;

                // АВяОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
                // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
                // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=false
                if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                  // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
                  if (targetNode.data.collectUserInput !== false) {
                    const autoTargetId = targetNode.data.autoTransitionTo;
                    const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                    code += '    \n';
                    code += '    # Пяоверяем, не ждем ли мы условный ввод перед автопереходом\n';
                    code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                    code += '        logging.info(f"⏸️ Автопяреход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                    code += '    else:\n';
                    code += `        # ⚡ Автопереход к узлу ${autoTargetId} (только если collectUserInput=true)\n`;
                    code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                    code += `        await handle_node_${safeAutoTargetId}(callback_query)\n`;
                    code += `        return\n`;
                  } else {
                    code += '    # Автопереход пропущен: collectUserInput=false\n';
                    code += `    logging.info(f"ℹ️ Узел ${targetNode.id} не собирает ответы (collectUserInput=false)")\n`;
                  }
                }
              }

              // КРИТИЧЕСКИ ВАЖНАЯ ЛОГИКА: Если этот узел имеет collectUserInput, настраиваем состояние ожидания
              if (targetNode.data.collectUserInput === true) {
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

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть inline кнопки И НЕТ текстового/медиа ввода, НЕ настраиваем ожидание ввода
                // Для reply кнопояя ВСЕГДА настраиваем ожидание ввода если enableTextInput === true
                const hasInputEnabled = targetNode.data.enableTextInput || targetNode.data.enablePhotoInput ||
                  targetNode.data.enableVideoInput || targetNode.data.enableAudioInput ||
                  targetNode.data.enableDocumentInput;

                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0 && !hasInputEnabled) {
                  code += '    \n';
                  code += `    logging.info(f"✅ Узел ${targetNode.id} имеет inline кнопки БЕЗ текстового/медиа ввода - яяЕ настяяаиваем ожидание ввода")\n`;
                  code += `    # ИСПРАВЛЕНИЕ: У узла есть inline кнопки без текстового/медиа ввода\n`;
                } else {
                  code += '    \n';
                  /**
                   * БЛОК 6: Управление состоянием ожидания пользовательского ввода
                   * Активирует сбор данных от пользователя после отправки сообщения
                   * Поддерживает различные типы ввода: текст, фото, видео, аудио, документы
                   * Использует универсальную функцию generateWaitingStateCode для настройки
                   */
                  
                  code += '    # КРИТИЧЕСКИ ВАЖНО: Настраиваем ожидание ввода для message узла с collectUserInput\n';
                  code += '    # Используем универсальную функцию для определения правильного типа ввода (text/photo/video/audio/document)\n';
                  // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
                  code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
                }
              }
            }

            /**
             * БЛОК 7: Обработка специальных типов медиа-узлов
             * Генерирует код для отправки различных типов медиа:
             * - sticker: стикеры Telegram
             * - voice: голосовые сообщения
             * - animation: анимации/GIF
             * - location: геолокация и карты
             * - contact: контактная информация
             */
            
            // Обрабатываем различные типы целевых узлов
            else if (targetNode.type === 'sticker') {
              const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";

              code += `    sticker_url = "${stickerUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(sticker_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(sticker_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                sticker_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используяям URL или file_id для стикеров\n';
              code += '            sticker_file = sticker_url\n';
              code += '        \n';

              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для sticker nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить стикер")\n';

            } else if (targetNode.type === 'voice') {
              const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              const duration = targetNode.data.duration || 30;

              code += `    voice_url = "${voiceUrl}"\n`;
              code += `    duration = ${duration}\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(voice_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(voice_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                voice_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            voice_file = voice_url\n';
              code += '        \n';

              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для voice nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить голосовое сообщение")\n';

            } else if (targetNode.type === 'animation') {
              const caption = targetNode.data.mediaCaption || "🎬 Анимация";
              const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";

              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }

              code += `    animation_url = "${animationUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(animation_url):\n';
              code += '            # Отпяяяяавляем локальный файл\n';
              code += '            file_path = get_local_file_path(animation_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                animation_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не наяден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            animation_file = animation_url\n';
              code += '        \n';

              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для animation nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить анимацию\\n{caption}")\n';

            } else if (targetNode.type === 'location') {
              let latitude = targetNode.data.latitude || 55.7558;
              let longitude = targetNode.data.longitude || 37.6176;
              const title = targetNode.data.title || "";
              const address = targetNode.data.address || "";
              const city = targetNode.data.city || "";
              const country = targetNode.data.country || "";
              const mapService = targetNode.data.mapService || 'custom';
              const generateMapPreview = targetNode.data.generateMapPreview !== false;

              code += '    # Определяем координаты на основе выбранного сервиса карт\n';

              if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
                code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
                code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
                code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else {
                code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
              }

              if (title) code += `    title = "${title}"\n`;
              if (address) code += `    address = "${address}"\n`;

              code += '    try:\n';
              code += '        # Удаляем старое сообщение\n';

              code += '        # ятправляем геолокацию\n';
              if (title || address) {
                code += '        await bot.send_venue(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude,\n';
                code += '            title=title,\n';
                code += '            address=address\n';
                code += '        )\n';
              } else {
                code += '        await bot.send_location(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude\n';
                code += '        )\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';

              // Генерируем кнопки для картографических сервисов если включено
              if (generateMapPreview) {
                code += '        \n';
                code += '        # Генерируем ссылки на картографические сервисы\n';
                code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
                code += '        \n';
                code += '        # Создаем кнопки для различных карт\n';
                code += '        map_builder = InlineKeyboardBuilder()\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';

                if (targetNode.data.showDirections) {
                  code += '        # Добавляем кнопки для построения маршрута\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
                }

                code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
                code += '        map_keyboard = map_builder.as_markup()\n';
                code += '        \n';
                code += '        await bot.send_message(\n';
                code += '            callback_query.from_user.id,\n';
                if (targetNode.data.showDirections) {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
                } else {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
                }
                code += '            reply_markup=map_keyboard\n';
                code += '        )\n';
              }

              // Добавляем дополнительные кнопки если они есть
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        \n';
                code += '        # Отправляем дополнительные кнопки\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошябка отправки местоположения: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';

            } else if (targetNode.type === 'contact') {
              const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
              const firstName = targetNode.data.firstName || "Контакт";
              const lastName = targetNode.data.lastName || "";
              const userId = targetNode.data.userId || null;
              const vcard = targetNode.data.vcard || "";

              code += `    phone_number = "${phoneNumber}"\n`;
              code += `    first_name = "${firstName}"\n`;
              if (lastName) code += `    last_name = "${lastName}"\n`;
              if (userId) code += `    user_id = ${userId}\n`;
              if (vcard) code += `    vcard = """${vcard}"""\n`;

              code += '    try:\n';

              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
                }
              } else {
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
                }
              }

              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить контакт")\n';

            /**
             * БЛОК 8: Обработка узлов пользовательского ввода
             * Специализированные узлы для сбора данных от пользователя
             * Поддерживают различные типы ввода:
             * - Текстовый ввод с валидацией
             * - Кнопочный выбор (inline/reply)
             * - Множественный выбор с кнопкой "Готово"
             * - Настройки валидации и таймаутов
             */
            
            } else if (targetNode.type === 'user-input') {
              // Обрабатываем узла пользовательского ввода
              const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
              const responseType = targetNode.data.responseType || 'text';
              const inputType = targetNode.data.inputType || 'text';
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const responseOptions = targetNode.data.responseOptions || [];
              const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
              const inputValidation = targetNode.data.inputValidation || '';
              const minLength = targetNode.data.minLength || 0;
              const maxLength = targetNode.data.maxLength || 0;
              const inputTimeout = targetNode.data.inputTimeout || 60;
              const inputRequired = targetNode.data.inputRequired !== false;
              const allowSkip = targetNode.data.allowSkip || false;
              const saveToDatabase = targetNode.data.saveToDatabase || false;
              const inputRetryMessage = targetNode.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
              const inputSuccessMessage = targetNode.data.inputSuccessMessage || "";
              const placeholder = targetNode.data.placeholder || "";

              code += '    # Удаляем старое сообщение\n';
              code += '    \n';

              // Отправляем запрояя пользователю
              const formattedPrompt = formatTextForPython(inputPrompt);
              code += `    text = ${formattedPrompt}\n`;

              if (responseType === 'buttons' && responseOptions.length > 0) {
                // Обработка кнопочного ответа
                const buttonType = targetNode.data.buttonType || 'inline';
                code += '    \n';
                code += '    # Создаем кнопки для выбора ответа\n';

                if (buttonType === 'reply') {
                  code += '    builder = ReplyKeyboardBuilder()\n';

                  (responseOptions as ResponseOption[]).forEach((option: ResponseOption, index: number) => {
                    code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
                  });

                  if (allowSkip) {
                    code += `    builder.add(KeyboardButton(text="⏭️ Пропустить"))\n`;
                  }

                  code += '    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                } else {
                  code += '    builder = InlineKeyboardBuilder()\n';

                  (responseOptions as ResponseOption[]).forEach((option: ResponseOption, index: number) => {
                    const optionValue = option.value || option.text;
                    code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="response_${targetNode.id}_${index}"))\n`;
                  });

                  if (allowSkip) {
                    code += `    builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_${targetNode.id}"))\n`;
                  }

                  code += '    keyboard = builder.as_markup()\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                }
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Находим следующий узел для перехода после успешного ввода
                const nextConnection = connections.find(conn => conn.source === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.target : null;

                code += '    # Сохраняем настройки для обработки ответа\n';
                code += '    user_data[callback_query.from_user.id]["button_response_config"] = {\n';
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
                code += `        "next_node_id": "${nextNodeId || ''}",\n`;
                code += '        "options": [\n';
                (responseOptions as ResponseOption[]).forEach((option: ResponseOption, index: number) => {
                  const optionValue = option.value || option.text;
                  const optionAction = option.action || 'goto';
                  const optionTarget = option.target || '';
                  const optionUrl = option.url || '';
                  code += `            {"index": ${index}, "text": "${escapeForJsonString(option.text)}", "value": "${escapeForJsonString(optionValue)}", "action": "${optionAction}", "target": "${optionTarget}", "url": "${escapeForJsonString(optionUrl)}"},\n`;
                });
                code += '        ],\n';
                code += `        "selected": []\n`;
                code += '    }\n';

              } else {
                // Обработка текстового ввода (оригинальная логика)
                if (placeholder) {
                  code += `    placeholder_text = "${placeholder}"\n`;
                  code += '    text += f"\\n\\n💡 {placeholder_text}"\n';
                }

                if (allowSkip) {
                  code += '    text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
                }

                code += '    await bot.send_message(callback_query.from_user.id, text)\n';
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем collectUserInput перед установкой waiting_for_input
                const textInputCollect = targetNode.data.collectUserInput === true ||
                  targetNode.data.enableTextInput === true ||
                  targetNode.data.enablePhotoInput === true ||
                  targetNode.data.enableVideoInput === true ||
                  targetNode.data.enableAudioInput === true ||
                  targetNode.data.enableDocumentInput === true;

                if (textInputCollect) {
                  // Находим следующий узел для перехода после успешного ввода
                  const nextConnection = connections.find(conn => conn.source === targetNode.id);
                  const nextNodeId = nextConnection ? nextConnection.target : null;

                  code += '    # Настраиваем ожидание ввода (collectUserInput=true)\n';
                  code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                  code += `        "type": "${inputType}",\n`;
                  code += `        "variable": "${inputVariable}",\n`;
                  code += `        "validation": "${inputValidation}",\n`;
                  code += `        "min_length": ${minLength},\n`;
                  code += `        "max_length": ${maxLength},\n`;
                  code += `        "timeout": ${inputTimeout},\n`;
                  code += `        "required": ${toPythonBoolean(inputRequired)},\n`;
                  code += `        "allow_skip": ${toPythonBoolean(allowSkip)},\n`;
                  code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                  code += `        "retry_message": "${escapeForJsonString(inputRetryMessage)}",\n`;
                  code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                  code += `        "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
                  code += `        "node_id": "${targetNode.id}",\n`;
                  code += `        "next_node_id": "${nextNodeId || ''}"\n`;
                  code += '    }\n';
                } else {
                  code += `    # Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
                }
              }

            /**
             * БЛОК 9: Обработка start узлов
             * Специальная логика для начальных сообщений бота
             * Поддерживает условные сообщения и различные типы клавиатур
             * Может инициировать процесс сбора данных пользователя
             */
            
            } else if (targetNode.type === 'start') {
              // Обрабатываем узла начала в запросах обратного вызова - показываем начальное сообщение с кнопками
              const messageText = targetNode.data.messageText || "Добро пожаловать!";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);

              code += `    # Обрабатываем узел start: ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;

              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');

              // Добавляем поддержку условных сообщений для start узлов
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для start узла\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';

                // Используем условное сообщение, если доступно, иначе используем стандартное
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    # Инициализируем переменную conditional_keyboard, если она не была определена\n';
                code += '    if "conditional_keyboard" not in locals():\n';
                code += '        conditional_keyboard = None\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }

              // Создаем inline клавиатуру для start узла (только если нет условной клавиатуры)
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли условная клявиаяуяа\n';
                code += '    if keyboard is None:\n';
                code += '        # Создаем inline клавиатуру для start узла\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data для каждой кнопки
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `        builder.adjust(${columns})\n`;
                code += '        keyboard = builder.as_markup()\n';
              }

              // Отправляем сообщение start узла
              code += '    # Отправляем сообщение start узла\n';
              code += '    try:\n';
              code += '        if keyboard is not None:\n';
              code += `            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
              code += '        else:\n';
              code += `            await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
              code += '    except Exception:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.answer(text${parseMode})\n`;

            /**
             * БЛОК 10: Обработка command узлов
             * Специальные узлы для выполнения команд бота
             * Могут содержать текстовые сообщения и кнопки
             * Поддерживают различные форматы сообщений (Markdown, HTML)
             */
            
            } else if (targetNode.type === 'command') {
              // Обрабатываем узла команд в запросах обратного вызова
              const command = targetNode.data.command || '/start';
              const commandMessage = targetNode.data.messageText || `Выполняем команду ${command}`;
              const cleanedCommandMessage = stripHtmlTags(commandMessage);
              const formattedCommandText = formatTextForPython(cleanedCommandMessage);
              const parseMode = getParseMode(targetNode.data.formatMode);

              code += `    # Обрабатываем узел command: ${targetNode.id}\n`;
              code += `    text = ${formattedCommandText}\n`;

              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');

              // Создаем inline клавиатуру для command узла если есть кнопки
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Создаем inline клавиатуру для command узла\n';
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `    builder.adjust(${columns})\n`;
                code += '    keyboard = builder.as_markup()\n';
                code += '    # Отправляем сообщение command узла с клавиатурой\n';
                code += '    try:\n';
                code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              } else {
                code += '    # Отправляем сообщение command узла без клавиатуры\n';
                code += '    try:\n';
                code += `        await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text${parseMode})\n`;
              }

            /**
             * БЛОК 11: Универсальный обработчик для остальных типов узлов
             * Обрабатывает текстовые сообщения и другие неспециализированные узлы
             * Поддерживает условные сообщения и сбор пользовательского ввода
             * Создает соответствующие клавиатуры (inline/reply) при необходимости
             */
            
            } else {
              // Универсальный обработчик для узлов сообщений и других текстовых узлов
              code += `    # Обрабатываем узел типа ${targetNode.type}: ${targetNode.id}\n`;

              if (targetNode.type === 'message') {
                // Обрабатываем узла сообщений и другие текстовые узла
                const targetText = targetNode.data.messageText || "Сообщение";
                const cleanedText = stripHtmlTags(targetText);
                const formattedTargetText = formatTextForPython(cleanedText);
                const parseMode = getParseMode(targetNode.data.formatMode);

                code += `    text = ${formattedTargetText}\n`;

                // Добавляем замену переменных в тексте
                code += generateUniversalVariableReplacement('    ');

                // Добавляем поддержку условных сообщений для keyboard узлов с collectUserInput
                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  code += '    \n';
                  code += '    # Проверка условных сообщений для keyboard узла\n';
                  code += '    user_record = await get_user_from_db(callback_query.from_user.id)\n';
                  code += '    if not user_record:\n';
                  code += '        user_record = user_data.get(callback_query.from_user.id, {})\n';
                  code += '    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})\n';
                  code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                  code += '    \n';

                  // Используем условное сообщение, если доступно, иначе используем стандартное
                  code += '    # Используем условное сообщение если есть подходящее условие\n';
                  code += '    if "text" not in locals():\n';
                  code += `        text = ${formattedTargetText}\n`;
                  code += '    \n';
                  code += '    # Используем условную клавиатуру если есть\n';
                  code += '    if conditional_keyboard is not None:\n';
                  code += '        keyboard = conditional_keyboard\n';
                  code += '    else:\n';
                  code += '        keyboard = None\n';
                  code += '    \n';
                }
              }

              // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла (основной цикл)
              if (targetNode.data.collectUserInput === true) {
                // Настраиваем сбор пользовательского ввода
                code += '    # Активируем сбор пользовательского ввода (основной цикл)\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Используем helper функцию с правильным контекстом callback_query
                code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
                code += '    \n';

                // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок с проверкой условной клавиатуры
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли условная клавиатуря для этого узла\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)\n';
                  code += '        builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button, index: number) => {
                    if (btn.action === "url") {
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      // Создаем уникальный callback_data для каждой кнопки
                      const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                      const uniqueCallbackData = `${callbackData}_btn_${targetNode.data.buttons.indexOf(btn)}`;
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${uniqueCallbackData}"))\n`;
                    } else if (btn.action === 'command') {
                      // Для кнопок команд создаем специальную callback_data
                      const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                    }
                  });
                  // Добавляем настройку колонок для консистентности
                  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                  code += `        builder.adjust(${columns})\n`;
                  code += '        keyboard = builder.as_markup()\n';
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли условная клавиатура для этого узла\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем reply клавиатуру (+ сбор ввода включен)\n';
                  const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data);
                  code += keyboardCode;
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += '    # Для reply клавиатуры отправляем новое сообщение\n';
                  code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
                }
                code += '    \n';
              } else {
                // Обычное отображение сообщения без сбора ввода
                // Обрабатываем клавиатуру для целевого узла
                code += `    # DEBUG: Узел ${targetNode.id} - hasRegularButtons=${toPythonBoolean(targetNode.data.buttons && targetNode.data.buttons.length > 0)}, hasInputCollection=False\n`;
                code += `    logging.info(f"DEBUG: Узел ${targetNode.id} обработка кнопок - keyboardType=${targetNode.data.keyboardType}, buttons=${targetNode.data.buttons ? targetNode.data.buttons.length : 0}")\n`;
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                  code += `    logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${targetNode.id} с ${targetNode.data.buttons.length} кнопками")\n`;
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                  // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                  const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                  code += keyboardCode;
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем reply клавиатуру\n';
                  const keyboardCode = generateReplyKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data);
                  code += keyboardCode;
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else {
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  // Для автопереходов отправляем новое сообщение вместо редактирования
                  code += `    await callback_query.message.answer(text${parseModeTarget})\n`;
                }
              } // Закрываем else блок для обычного отображения (основной цикл)
            } // Закрываем else блок для обычных текстовых сообщений (основной цикл)
          } else {
            /**
             * БЛОК 12: Обработка кнопки без цели
             * Fallback обработчик для кнопок без настроенного target
             * Показывает уведомление пользователю о том, что кнопка не настроена
             */
            
            // Кнопка без цели - просто уведомляем пользователя
            code += '    # Кнопка пока никуда не ведет\n';
            code += '    await callback_query.answer("⚠️ Эта кнопка яока не настроена", show_alert=True)\n';
          }
        } else if (button.action === 'command' && button.id) {
          /**
           * БЛОК 13: Обработка кнопок с действием 'command'
           * Создает обработчики для выполнения команд бота через callback кнопки
           * Формирует специальную callback_data с префиксом 'cmd_'
           */
          
          // Обработка кнопок с действием "command"
          const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;

          // Избегаем дублирования обработчиков
          if (processedCallbacks.has(callbackData)) return;
          processedCallbacks.add(callbackData);

          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    # Проверяем флаг hideAfterClick яяля кнопок\n';
          code += `    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных командных кнопок\n`;
          code += '    await callback_query.answer()\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    # Инициализируем базовыя переменные пользователя\n';
          code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
          code += '    \n';
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          code += '    # Сохраняем кяопку в базу данных\n';
          code += '    timestamp = get_moscow_time()\n';
          code += '    response_data = button_text\n';
          code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
          code += `    logging.info(f"Команда ${button.target || 'неизвестная'} выполнена через callback кнопку (пользователь {user_id})")\n`;
          code += '    \n';

          // Создаем правильный вызов команды для callback кнопок
          if (button.target) {
            // Определяем команду - убираем ведущий сляяш если есть
            const command = button.target.startsWith('/') ? button.target.replace('/', '') : button.target;
            const handlerName = `${command}_handler`;

            code += `    # Вызываем ${handlerName} правильно через edit_text\n`;
            code += '    # Созяаем специальный объект для редактирования сообщения\n';
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
            code += `    await ${handlerName}(fake_edit_message)\n`;
          } else {
            code += '    await callback_query.message.edit_text("❌ Команда не найдена")\n';
          }
        }
      });
    });
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


