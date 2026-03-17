/**
 * @fileoverview Утилита для получения пути к директории шаблонов
 * Работает как в Node.js так и при сборке Vite
 */

/**
 * Получает абсолютный путь к директории шаблонов
 *
 * @returns Абсолютный путь к lib/templates/
 */
export function getTemplatesDir(): string {
  if (typeof window !== 'undefined') {
    return '/lib/templates';
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  return path.join(process.cwd(), 'lib', 'templates');
}

/**
 * Получает абсолютный путь к файлу шаблона
 *
 * @param templateName - Имя шаблона относительно templates/
 * @returns Абсолютный путь к шаблону
 */
export function getTemplatePath(templateName: string): string {
  const templatesDir = getTemplatesDir();

  if (typeof window !== 'undefined') {
    return templatesDir + '/' + templateName.replace(/\\/g, '/');
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  return path.join(templatesDir, templateName);
}
