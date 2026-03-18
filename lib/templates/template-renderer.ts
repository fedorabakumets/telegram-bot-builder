/**
 * @fileoverview Рендерер шаблонов Nunjucks для генерации Python кода
 * Инициализирует окружение, регистрирует фильтры, предоставляет функции рендеринга
 */

import { Environment, FileSystemLoader } from 'nunjucks';
import {
  safeNameFilter,
  commandToHandlerFilter,
  escapePythonFilter,
  hasInlineButtonsFilter,
  hasAutoTransitionsFilter,
  hasMediaNodesFilter,
  hasUploadImagesFilter,
  formatBotFatherCommands,
  formatPythonTextFilter,
  toPythonBooleanFilter,
  generateShortIdFilter,
  escapePythonStringFilter,
  sliceFilter,
  mapFilter,
  joinFilter,
  lowerFilter,
  escapeFilter,
} from './filters';
import { getTemplatesDir } from './utils/get-templates-dir';


/**
 * Проверяет что код выполняется в Node.js среде
 */
function isNodeEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Окружение Nunjucks для рендеринга шаблонов
 */
let env: Environment | null = null;

/**
 * Кеш скомпилированных шаблонов
 */
const templateCache = new Map<string, ReturnType<Environment['getTemplate']>>();

/**
 * Инициализирует окружение Nunjucks
 * Вызывается один раз при первом использовании
 */
function initEnvironment(): Environment {
  if (env) return env;
  
  // Проверяем что мы в Node.js
  if (!isNodeEnvironment()) {
    throw new Error('Nunjucks template rendering is only available in Node.js environment');
  }

  const templatesDir = getTemplatesDir();
  
  env = new Environment(new FileSystemLoader(templatesDir), {
    autoescape: false,    // Отключаем авто-экранирование для Python кода
    trimBlocks: false,    // Сохраняем newlines после блоков для корректного форматирования
    lstripBlocks: true,   // Удаляем пробелы в начале строки блока
  });

  // Регистрируем фильтры
  env.addFilter('safe_name', safeNameFilter);
  env.addFilter('command_to_handler', commandToHandlerFilter);
  env.addFilter('e', escapePythonFilter);        // Короткий алиас для escapePython
  env.addFilter('escape_python', escapePythonFilter);
  env.addFilter('has_inline', hasInlineButtonsFilter);
  env.addFilter('has_auto_transition', hasAutoTransitionsFilter);
  env.addFilter('has_media', hasMediaNodesFilter);
  env.addFilter('has_upload_images', hasUploadImagesFilter);
  env.addFilter('format_bot_father_commands', formatBotFatherCommands);
  env.addFilter('format_python_text', formatPythonTextFilter);
  env.addFilter('to_python_boolean', toPythonBooleanFilter);
  env.addFilter('generate_short_id', generateShortIdFilter);
  env.addFilter('escape_python_string', escapePythonStringFilter);
  env.addFilter('slice', sliceFilter);
  env.addFilter('map', mapFilter);
  env.addFilter('join', joinFilter);
  env.addFilter('lower', lowerFilter);
  env.addFilter('escape', escapeFilter);

  return env;
}

/**
 * Параметры для рендеринга бота
 */
export interface TemplateRenderOptions {
  /** Имя бота */
  botName: string;
  /** Массив узлов бота */
  nodes: any[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** ID проекта */
  projectId?: number | null;
  /** Включить комментарии в коде */
  enableComments: boolean;
  /** Включить логирование */
  enableLogging: boolean;
}

/**
 * Рендерит полный код бота из главного шаблона
 *
 * @param options - Параметры рендеринга
 * @returns Сгенерированный Python код
 *
 * @example
 * renderBotTemplate({
 *   botName: 'MyBot',
 *   nodes: [...],
 *   userDatabaseEnabled: true,
 *   enableComments: true,
 * })
 */
export function renderBotTemplate(options: TemplateRenderOptions): string {
  const environment = initEnvironment();
  const template = environment.getTemplate('bot.py.jinja2');

  // Подготавливаем контекст для шаблона
  const context = {
    botName: options.botName,
    nodes: options.nodes,
    userDatabaseEnabled: options.userDatabaseEnabled,
    projectId: options.projectId,
    enableComments: options.enableComments,
    enableLogging: options.enableLogging,
    botFatherCommands: formatBotFatherCommands(options.nodes),
    hasInlineButtons: options.nodes.some(hasInlineButtonsFilter),
    hasAutoTransitions: options.nodes.some(hasAutoTransitionsFilter),
    hasMediaNodes: options.nodes.some(hasMediaNodesFilter),
    hasUploadImages: options.nodes.some(hasUploadImagesFilter),
  };

  return template.render(context);
}

/**
 * Рендерит отдельный частичный шаблон
 * Используется для тестирования отдельных компонентов
 *
 * @param partialName - Имя частичного шаблона (например, 'config/config.py.jinja2')
 * @param context - Контекст для шаблона
 * @returns Сгенерированный код
 *
 * @example
 * renderPartialTemplate('config/config.py.jinja2', {
 *   userDatabaseEnabled: true,
 *   projectId: 123,
 * })
 */
export function renderPartialTemplate(
  partialName: string,
  context: Record<string, any>
): string {
  try {
    const environment = initEnvironment();
    
    // Для шаблонов в handlers/ используем полный путь
    // Для остальных шаблонов пытаемся определить директорию автоматически
    let templatePath = partialName;

    // Если путь содержит '/', используем его как есть
    if (!partialName.includes('/')) {
      const templateDirs = ['config', 'database', 'utils', 'main', 'header', 'middleware', 'universal-handlers', 'imports', 'command', 'start', 'keyboard', 'message', 'broadcast', 'broadcast-bot', 'broadcast-client', 'sticker', 'voice', 'safe-edit-or-send', 'synonyms', 'attached-media', 'user-handler', 'admin-rights', 'map', 'message-handler'];
      const dir = templateDirs.find(d => partialName.startsWith(d));
      if (dir) {
        templatePath = `${dir}/${partialName}`;
      }
    }

    // Используем кеш скомпилированных шаблонов
    let template = templateCache.get(templatePath);
    if (!template) {
      template = environment.getTemplate(templatePath);
      templateCache.set(templatePath, template);
    }
    return template.render(context);
  } catch (error: any) {
    if (error.message.includes('Node.js') || error.message.includes('browser')) {
      throw new Error(`Template rendering is not available in browser. Use browser-compatible functions instead. Template: ${partialName}`);
    }
    if (error.message.includes('template not found')) {
      throw new Error(`Template not found: ${partialName}. Checked in ${getTemplatesDir()}`);
    }
    throw error;
  }
}

/**
 * Проверяет существование шаблона
 *
 * @param templateName - Имя шаблона
 * @returns true если шаблон существует
 */
export function hasTemplate(templateName: string): boolean {
  try {
    const environment = initEnvironment();
    environment.getTemplate(templateName);
    return true;
  } catch {
    return false;
  }
}
