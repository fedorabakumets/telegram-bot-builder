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
} from './filters';
import { getTemplatesDir } from './utils/get-templates-dir';
import {
  importsParamsSchema,
  configParamsSchema,
  headerParamsSchema,
  databaseParamsSchema,
  utilsParamsSchema,
  mainParamsSchema,
  botParamsSchema,
} from './schemas';

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
    // Валидация параметров через Zod схемы
    let validated = context;
    const schemaMap: Record<string, any> = {
      'imports': importsParamsSchema,
      'config': configParamsSchema,
      'header': headerParamsSchema,
      'database': databaseParamsSchema,
      'utils': utilsParamsSchema,
      'main': mainParamsSchema,
      'bot': botParamsSchema,
    };

    // Извлекаем имя шаблона из пути (поддерживаем оба формата)
    let templateName = partialName;
    // Удаляем расширение
    templateName = templateName.replace('.py.jinja2', '');
    // Удаляем путь директории
    templateName = templateName.replace('partials/', '')
                               .replace('config/', '')
                               .replace('database/', '')
                               .replace('utils/', '')
                               .replace('main/', '')
                               .replace('header/', '')
                               .replace('middleware/', '')
                               .replace('universal-handlers/', '');

    if (schemaMap[templateName]) {
      try {
        validated = schemaMap[templateName].parse(context);
      } catch (validationError: any) {
        console.error(`[template-renderer] Валидация параметров для ${partialName} не пройдена:`, validationError.errors);
        throw new Error(`Валидация параметров шаблона ${partialName} не пройдена: ${validationError.message}`);
      }
    }

    const environment = initEnvironment();
    // Определяем путь к шаблону на основе имени
    // Новые шаблоны находятся в своих директориях: config/config.py.jinja2, database/database.py.jinja2, etc.
    let templatePath = partialName;
    
    // Если путь не содержит '/', определяем директорию на основе имени шаблона
    if (!partialName.includes('/')) {
      const templateDirs = ['config', 'database', 'utils', 'main', 'header', 'middleware', 'universal-handlers', 'imports'];
      const dir = templateDirs.find(d => partialName.startsWith(d));
      if (dir) {
        templatePath = `${dir}/${partialName}`;
      } else {
        // Для обратной совместимости используем 'partials/'
        templatePath = `partials/${partialName}`;
      }
    }
    
    const template = environment.getTemplate(templatePath);
    return template.render(validated);
  } catch (error: any) {
    // Если мы в браузере и Nunjucks недоступен, бросаем понятную ошибку
    if (error.message.includes('Node.js') || error.message.includes('browser')) {
      throw new Error(`Template rendering is not available in browser. Use browser-compatible functions instead. Template: ${partialName}`);
    }
    // Пробрасываем ошибки валидации
    if (error.message.includes('Валидация параметров')) {
      throw error;
    }
    throw error;
  }
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
