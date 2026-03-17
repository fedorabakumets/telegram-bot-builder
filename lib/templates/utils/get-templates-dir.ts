/**
 * @fileoverview Утилита для получения пути к директории шаблонов
 * Без импорта Node.js модулей — чтобы Vite не тянул их в браузерный бандл
 */

/**
 * Получает абсолютный путь к директории шаблонов
 */
export function getTemplatesDir(): string {
  if (typeof window !== 'undefined') {
    return '/lib/templates';
  }
  return process.cwd() + '/lib/templates';
}

/**
 * Получает абсолютный путь к файлу шаблона
 */
export function getTemplatePath(templateName: string): string {
  return getTemplatesDir() + '/' + templateName.replace(/\\/g, '/');
}
