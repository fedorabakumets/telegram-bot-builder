/**
 * @fileoverview Рендерер шаблонов Nunjucks для генерации Python кода
 * Инициализирует окружение, регистрирует фильтры, предоставляет функции рендеринга
 */

import { Environment, FileSystemLoader } from 'nunjucks';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  safeNameFilter,
  commandToHandlerFilter,
  escapePythonFilter,
  hasInlineButtonsFilter,
  hasAutoTransitionsFilter,
  hasMediaNodesFilter,
  hasUploadImagesFilter,
  formatBotFatherCommands,
} from './filters.js';

// Получаем директорию текущего модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, 'templates');

/**
 * Окружение Nunjucks для рендеринга шаблонов
 */
let env: Environment;

/**
 * Инициализирует окружение Nunjucks
 * Вызывается один раз при первом использовании
 */
function initEnvironment(): Environment {
  if (env) return env;

  env = new Environment(new FileSystemLoader(templatesDir), {
    autoescape: false,    // Отключаем авто-экранирование для Python кода
    trimBlocks: true,     // Удаляем первый newline после блока
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
 * @param partialName - Имя частичного шаблона (например, 'imports.py.jinja2')
 * @param context - Контекст для шаблона
 * @returns Сгенерированный код
 *
 * @example
 * renderPartialTemplate('imports.py.jinja2', {
 *   userDatabaseEnabled: true,
 *   hasInlineButtons: false,
 * })
 */
export function renderPartialTemplate(
  partialName: string,
  context: Record<string, any>
): string {
  const environment = initEnvironment();
  const template = environment.getTemplate(`partials/${partialName}`);
  return template.render(context);
}

/**
 * Рендерит макрос из файла
 * Используется для тестирования макросов
 *
 * @param macroFile - Имя файла с макросом
 * @param macroName - Имя макроса
 * @param args - Аргументы для макроса
 * @returns Сгенерированный код
 */
export function renderMacro(
  macroFile: string,
  macroName: string,
  args: Record<string, any>
): string {
  const environment = initEnvironment();
  
  // Создаём функцию которая возвращает результат вызова макроса
  const templateSource = `{% from 'macros/${macroFile}' import ${macroName} %}{{ ${macroName}(${JSON.stringify(args)}) }}`;
  
  return environment.renderString(templateSource, args);
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
