// Внешние зависимости
import { BotData, BotGroup } from '@shared/schema';

// Ядро: контекст и состояние
import { createGenerationContext } from './bot-generator/core/create-generation-context';
import type { GenerationContext } from './bot-generator/core/generation-context';
import type { GenerationOptions } from './bot-generator/core/generation-options.types';

// Ядро: логирование
import { generatorLogger } from './bot-generator/core/generator-logger';

// Флаги возможностей
import { computeFeatureFlags, ALREADY_HANDLED_TYPES } from './bot-generator/core/feature-flags';
import type { FeatureFlags } from './bot-generator/core/feature-flags';

// Типы
import { logFlowAnalysis } from './bot-generator/core';
import { NODE_TYPES } from './bot-generator/types';
// Внутренние модули - использование экспорта бочек
import { generateBotFatherCommands } from './commands';

import { generateDatabaseCode } from './templates/database/database-code.renderer';
import { generateSafeEditOrSend, generateHeader, generateUniversalHandlers, generateMain, generateImports, generateConfig, generateUtils } from './templates/typed-renderer';
import { generateNodeHandlers } from './templates/node-handlers/node-handlers.dispatcher';
import { filterInlineNodes, hasInlineButtons, identifyNodesRequiringMultiSelectLogic } from './templates/keyboard/keyboard.renderer';
import { generateButtonResponse, generateMultiSelectCallback, generateMultiSelectDone, generateMultiSelectReply, generateReplyButtonHandlers, generateCommandCallbackHandler } from './templates/handlers';
import { generateInteractiveCallbackHandlers } from './templates/interactive-callback-handlers';
import { generateGroupHandlers } from './templates/group-handlers/group-handlers.renderer';
import { generateMediaFunctions } from './templates/media-functions/media-functions.renderer';
import { generateMessageLoggingCode } from './templates/middleware/middleware.renderer';
import { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile } from './scaffolding';
import { addAutoTransitionNodes } from './bot-generator/core/add-auto-transition-nodes';
import { addInputTargetNodes } from './bot-generator/core/add-input-target-nodes';
import { collectInputTargetNodes } from './bot-generator/core/collect-input-target-nodes';
import { assertValidPython } from './bot-generator/validation';
import { collectAllCommandCallbacksFromNodes, findCommandNode } from './bot-generator/core/command-utils';
import { emitOnce, COMPONENT_NAMES } from './bot-generator/core/generation-state';
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

// ---------------------------------------------------------------------------
// Типы pipeline
// ---------------------------------------------------------------------------

/** Секции сгенерированного кода */
interface CodeSections {
  header: string;
  imports: string;
  safeEditOrSend: string;
  config: string;
  loggingCode: string;
  databaseCode: string;
  utils: string;
  mediaFunctions: string;
  nodeHandlers: string;
  interactiveCallbackHandlers: string;
  replyButtonHandlers: string;
  buttonResponseHandlers: string;
  commandCallbackHandlers: string;
  groupHandlers: string;
  universalHandlers: string;
  main: string;
  multiSelectHandlers: string;
}

// ---------------------------------------------------------------------------
// Pipeline шаг 1: buildGenerationContext
// ---------------------------------------------------------------------------

/**
 * Создаёт контекст генерации из данных бота и опций
 */
function buildGenerationContext(
  botData: BotData,
  options: GeneratePythonCodeOptions
): { context: GenerationContext; genOptions: GenerationOptions } {
  const {
    botName = 'MyBot',
    groups = [],
    userDatabaseEnabled = false,
    projectId = null,
    enableLogging = false,
    enableGroupHandlers = false,
    enableComments = true,
  } = options;

  const genOptions: GenerationOptions = {
    enableLogging,
    enableComments,
    userDatabaseEnabled,
    enableGroupHandlers,
    projectId,
  };

  const context = createGenerationContext(botData, botName, groups, genOptions);
  return { context, genOptions };
}

// ---------------------------------------------------------------------------
// Pipeline шаг 3: generateCodeSections
// ---------------------------------------------------------------------------

/**
 * Генерирует все секции кода
 */
function generateCodeSections(
  context: GenerationContext,
  flags: FeatureFlags
): CodeSections {
  const nodes = context.nodes || [];
  const userDatabaseEnabled = !!context.options.userDatabaseEnabled;
  const state = context.state;

  // --- imports ---
  const imports = emitOnce(state, COMPONENT_NAMES.IMPORTS, () =>
    generateImports({
      userDatabaseEnabled,
      hasInlineButtons: flags.hasInlineButtonsResult,
      hasAutoTransitions: flags.hasAutoTransitionsResult,
      hasMediaNodes: flags.hasMediaNodesResult,
      hasUploadImages: flags.hasUploadImagesResult,
      hasParseModeNodes: flags.hasParseModeNodesResult,
      hasMediaGroups: flags.hasMediaGroupsResult,
      hasUrlImages: flags.hasUrlImagesResult,
      hasDatetimeNodes: flags.hasDatetimeNodesResult,
      hasTimezoneNodes: flags.hasTimezoneNodesResult,
      hasReplyKeyboard: flags.hasReplyKeyboardResult,
      hasLocalMediaFiles: flags.hasLocalMediaFilesResult,
      hasBotCommands: flags.hasBotCommandsResult,
    })
  );

  // --- safeEditOrSend ---
  const safeEditOrSend = emitOnce(state, COMPONENT_NAMES.SAFE_EDIT_OR_SEND, () =>
    generateSafeEditOrSend({
      hasInlineButtonsOrSpecialNodes:
        flags.hasInlineButtonsResult ||
        flags.hasNodesRequiringSafeEditOrSendResult ||
        userDatabaseEnabled,
      hasAutoTransitions: flags.hasAutoTransitionsResult || userDatabaseEnabled,
    })
  );

  // --- config ---
  const config = emitOnce(state, COMPONENT_NAMES.CONFIG, () =>
    generateConfig({
      userDatabaseEnabled,
      projectId: context.projectId,
    })
  );

  // --- logging middleware (включает save_message_to_api) ---
  const loggingCode = emitOnce(state, COMPONENT_NAMES.MIDDLEWARE, () =>
    userDatabaseEnabled
      ? generateMessageLoggingCode(
          userDatabaseEnabled,
          hasInlineButtons(nodes),
          context.projectId
        )
      : ''
  );

  // --- database ---
  const databaseCode = emitOnce(state, COMPONENT_NAMES.DATABASE, () =>
    generateDatabaseCode(userDatabaseEnabled, nodes)
  );

  // --- utils (содержит save_message_to_api-заглушку при userDatabaseEnabled=false) ---
  const utils = emitOnce(state, COMPONENT_NAMES.UTILS, () => {
    const adminOnly = nodes.some(n => n.data?.adminOnly);
    const isPrivateOnly = nodes.some(n => n.data?.isPrivateOnly);
    const requiresAuth = nodes.some(n => n.data?.requiresAuth);
    return generateUtils({ userDatabaseEnabled, adminOnly, isPrivateOnly, requiresAuth });
  });

  // --- media functions ---
  const mediaFunctions = emitOnce(state, COMPONENT_NAMES.MEDIA_FUNCTIONS, () =>
    flags.hasMediaNodesResult || flags.hasUploadImagesResult
      ? generateMediaFunctions()
      : ''
  );

  // --- node handlers ---
  const nodeHandlers = generateNodeHandlers(
    nodes,
    userDatabaseEnabled,
    !!context.options.enableComments
  );

  // --- allReferencedNodeIds (теперь часть контекста секции) ---
  const inputTargetNodeIds = collectInputTargetNodes(nodes);
  let allReferencedNodeIds = new Set<string>();
  addInputTargetNodes(inputTargetNodeIds, allReferencedNodeIds);
  addAutoTransitionNodes(nodes, allReferencedNodeIds);

  nodes.forEach(node => {
    if (!ALREADY_HANDLED_TYPES.has(node.type)) {
      allReferencedNodeIds.add(node.id);
    }
  });

  // Фильтрация: только реально существующие узлы, не обрабатываемые отдельно в nodeHandlers
  const existingNodeIds = new Set(nodes.map(node => node.id));
  const nodeTypeById = new Map(nodes.map(node => [node.id, node.type]));
  const filteredReferencedNodeIds = new Set<string>();
  allReferencedNodeIds.forEach(nodeId => {
    if (!existingNodeIds.has(nodeId)) {
      generatorLogger.debug(`Удалён узел из allReferencedNodeIds: ${nodeId} (не найден в текущих узлах)`);
      return;
    }
    const nodeType = nodeTypeById.get(nodeId);
    if (nodeType && ALREADY_HANDLED_TYPES.has(nodeType)) {
      generatorLogger.debug(`Удалён узел из allReferencedNodeIds: ${nodeId} (тип ${nodeType} уже обрабатывается в nodeHandlers)`);
      return;
    }
    filteredReferencedNodeIds.add(nodeId);
  });
  allReferencedNodeIds = filteredReferencedNodeIds;

  const inlineNodes = filterInlineNodes(nodes);
  const allConditionalButtons = new Set<string>();

  // --- interactive callback handlers ---
  const interactiveCallbackHandlers = generateInteractiveCallbackHandlers({
    inlineNodes,
    allReferencedNodeIds,
    allConditionalButtons,
    nodes,
    allNodeIds: context.allNodeIds,
    connections: [],
    userDatabaseEnabled,
    mediaVariablesMap: new Map(),
    processNodeButtonsAndGenerateHandlers: (_processedCallbacks) => {
      // TODO: implement — должен генерировать обработчики для inline-кнопок inlineNodes
      // и добавлять их ID в processedCallbacks, чтобы они не дублировались
      // в цикле allReferencedNodeIds внутри generateInteractiveCallbackHandlers.
    },
  });

  // --- reply button handlers ---
  const replyButtonHandlers = generateReplyButtonHandlers({ nodes, indentLevel: '' });

  // --- button response handlers for user input collection ---
  const userInputNodes = nodes.filter(node =>
    node.type === NODE_TYPES.MESSAGE &&
    node.data.responseType === 'buttons' &&
    Array.isArray(node.data.responseOptions) &&
    node.data.responseOptions.length > 0
  );

  let buttonResponseHandlers = '';
  if (userInputNodes.length > 0) {
    buttonResponseHandlers += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
    buttonResponseHandlers += generateButtonResponse({
      userInputNodes: userInputNodes.map(node => ({
        id: node.id,
        responseOptions: node.data.responseOptions,
        allowSkip: node.data.allowSkip,
      })),
      allNodes: nodes,
      indentLevel: '',
    });
  }

  // --- command callback handlers ---
  const commandButtons = collectAllCommandCallbacksFromNodes(nodes);
  generatorLogger.info(`Найдено кнопок команд: ${commandButtons.size}`);
  generatorLogger.debug('Список кнопок команд', Array.from(commandButtons));

  let commandCallbackHandlers = '';
  if (commandButtons.size > 0) {
    commandCallbackHandlers += '\n# Обработчики для кнопок команд\n';
    commandCallbackHandlers += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;

    commandButtons.forEach(commandCallback => {
      const commandNode = findCommandNode(commandCallback, nodes);
      const commandNodeType = commandNode ? (commandNode.type as 'start' | 'command') : '';
      const command = commandCallback.replace('cmd_', '');

      commandCallbackHandlers += generateCommandCallbackHandler({
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

  // --- group handlers ---
  const groupHandlers = emitOnce(state, COMPONENT_NAMES.GROUP_HANDLERS, () =>
    !!context.options.enableGroupHandlers
      ? '\n' + generateGroupHandlers(context.groups)
      : ''
  );

  // --- universal handlers ---
  const universalHandlers = emitOnce(state, COMPONENT_NAMES.UNIVERSAL_HANDLERS, () =>
    generateUniversalHandlers({ userDatabaseEnabled })
  );

  // --- main ---
  const menuCommands = nodes.filter(node =>
    (node.type === NODE_TYPES.START || node.type === NODE_TYPES.COMMAND) &&
    node.data.showInMenu &&
    node.data.command
  );

  const main = emitOnce(state, COMPONENT_NAMES.MAIN, () =>
    generateMain({
      userDatabaseEnabled,
      hasInlineButtons: hasInlineButtons(nodes),
      menuCommands: menuCommands.map(node => ({
        command: (node.data.command || '').replace('/', ''),
        description: node.data.description || 'Команда бота',
      })),
    })
  );

  // --- multiselect handlers ---
  const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(nodes);
  const multiSelectNodesWithLayout = multiSelectNodes.map((node: any) => {
    const layout = node.data?.keyboardLayout;
    const hasKeyboardLayout = !!(layout && (layout.rows?.length > 0 || layout.autoLayout));
    const keyboardLayoutAuto = !!(layout?.autoLayout);
    let adjustCode: string | undefined;
    if (hasKeyboardLayout && !keyboardLayoutAuto && layout.rows?.length > 0) {
      adjustCode = layout.rows.map((r: any) => r.buttonIds?.length ?? 1).join(', ');
    } else if (hasKeyboardLayout && keyboardLayoutAuto && layout.columns) {
      adjustCode = String(layout.columns);
    }

    // Вычисляем shortNodeId и кнопки для generateMultiSelectCallback
    const shortNodeId = String(node.id).slice(-10).replace(/^_+/, '');
    const allButtons: any[] = node.data?.buttons ?? [];
    const selectionButtons = allButtons
      .filter((b: any) => b.action === 'selection')
      .map((b: any) => {
        const value = b.target || b.id || 'btn';
        const valueTruncated = value.slice(-8);
        return {
          id: b.id,
          text: b.text,
          action: b.action,
          target: b.target,
          value,
          valueTruncated,
          escapedText: b.text.replace(/"/g, '\\"'),
          callbackData: `ms_${shortNodeId}_${valueTruncated}`,
        };
      });
    const regularButtons = allButtons
      .filter((b: any) => b.action !== 'selection' && b.action !== 'complete')
      .map((b: any) => ({ id: b.id, text: b.text, action: b.action, target: b.target }));
    const gotoButtons = allButtons
      .filter((b: any) => b.action === 'goto' && b.target)
      .map((b: any) => ({ id: b.id, text: b.text, action: b.action, target: b.target }));
    const completeBtn = allButtons.find((b: any) => b.action === 'complete');

    return {
      ...node,
      hasKeyboardLayout,
      keyboardLayoutAuto,
      adjustCode,
      shortNodeId,
      selectionButtons,
      regularButtons,
      gotoButtons,
      completeButton: completeBtn ? { text: completeBtn.text, target: completeBtn.target } : undefined,
      doneCallbackData: `done_${shortNodeId}`,
      totalButtonsCount: allButtons.length,
      variableName: node.data?.multiSelectVariable || `multi_select_${node.id}`,
    };
  });

  let multiSelectHandlers = '';
  if (multiSelectNodes && multiSelectNodes.length > 0) {
    multiSelectHandlers += generateMultiSelectCallback({
      multiSelectNodes: multiSelectNodesWithLayout as any[],
      allNodeIds: context.allNodeIds,
      indentLevel: '    ',
    });
    multiSelectHandlers += generateMultiSelectDone({
      allNodes: nodes as any[],
      multiSelectNodes: multiSelectNodesWithLayout as any[],
      allNodeIds: context.allNodeIds,
    });
    multiSelectHandlers += generateMultiSelectReply({
      allNodes: nodes as any[],
      multiSelectNodes: multiSelectNodesWithLayout as any[],
      allNodeIds: context.allNodeIds,
    });
  }

  return {
    header: emitOnce(state, COMPONENT_NAMES.HEADER, () => generateHeader({})),
    imports,
    safeEditOrSend,
    config,
    loggingCode,
    databaseCode,
    utils,
    mediaFunctions,
    nodeHandlers,
    interactiveCallbackHandlers,
    replyButtonHandlers,
    buttonResponseHandlers,
    commandCallbackHandlers,
    groupHandlers,
    universalHandlers,
    main,
    multiSelectHandlers,
  };
}

// ---------------------------------------------------------------------------
// Pipeline шаг 4: assembleAndValidate
// ---------------------------------------------------------------------------

/**
 * Собирает секции в финальный код и валидирует результат
 */
function assembleAndValidate(
  sections: CodeSections,
  context: GenerationContext
): string {
  const nodes = context.nodes || [];
  const botFatherCommands = generateBotFatherCommands(nodes);

  let code = '"""\n';
  code += `${context.botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';

  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }

  code += '"""\n\n';

  // Собираем секции, фильтруя пустые и нормализуя пробелы
  const sectionList = [
    sections.header,
    sections.imports,
    sections.safeEditOrSend,
    sections.config,
    sections.loggingCode,
    sections.databaseCode,
    sections.utils,
    sections.mediaFunctions,
    sections.nodeHandlers,
    sections.interactiveCallbackHandlers,
    sections.replyButtonHandlers,
    sections.buttonResponseHandlers,
    sections.commandCallbackHandlers,
    sections.groupHandlers,
    sections.universalHandlers,
    sections.multiSelectHandlers,
    sections.main,
  ];

  // Объединяем непустые секции с одним переносом строки между ними
  const nonEmpty = sectionList.filter(s => s && s.trim().length > 0);
  // Нормализуем начало каждой секции — убираем ведущие пустые строки
  const trimmedSections = nonEmpty.map(s => s.replace(/^[\r\n]+/, ''));
  code += trimmedSections.join('\n\n');

  // Нормализуем: не более 2 пустых строк подряд (PEP8: 2 пустые строки между top-level функциями)
  code = code.replace(/\r\n/g, '\n');
  code = code.replace(/\n[ \t]+\n/g, '\n\n');  // строки только с пробелами → пустые строки
  code = code.replace(/\n{4,}/g, '\n\n\n');
  // Внутри функций (строки с отступом) — не более 1 пустой строки
  code = code.replace(/([ \t]+[^\n]+\n)\n{2,}([ \t])/g, '$1\n$2');

  assertValidPython(code);

  return code;
}

// ---------------------------------------------------------------------------
// Публичный API
// ---------------------------------------------------------------------------

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
  const { context } = buildGenerationContext(botData, options);

  logFlowAnalysis(context.nodes);

  const flags = computeFeatureFlags(context);
  const sections = generateCodeSections(context, flags);

  return assembleAndValidate(sections, context);
}

// Реэкспорт типов и функций для обратной совместимости
export type { Button } from './bot-generator/types';
export type { ResponseOption } from './bot-generator/types';
export { isLoggingEnabled } from './bot-generator/core';

// Повторный экспорт функций каркаса
export { generateDockerfile, generateReadme, generateRequirementsTxt, generateEnvFile };
