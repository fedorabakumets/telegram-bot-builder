/**
 * @fileoverview Утилита для получения пути к директории шаблонов
 * Работает как в Node.js так и при сборке Vite
 */

import * as path from 'path';

/**
 * Получает абсолютный путь к директории шаблонов
 *
 * @returns Абсолютный путь к lib/templates/
 */
export function getTemplatesDir(): string {
  // Для browser-сборки используем абсолютный путь
  // Vite автоматически подставляет правильный путь при сборке
  if (typeof window !== 'undefined') {
    // В браузере возвращаем относительный путь который Vite обработает
    return '/lib/templates';
  }

  // Для Node.js используем process.cwd()
  const projectRoot = process.cwd();
  return path.join(projectRoot, 'lib', 'templates');
}

/**
 * Получает абсолютный путь к файлу шаблона
 *
 * @param templateName - Имя шаблона относительно templates/
 * @returns Абсолютный путь к шаблону
 */
export function getTemplatePath(templateName: string): string {
  const templatesDir = getTemplatesDir();
  
  // Для браузера используем простую конкатенацию вместо path.join
  if (typeof window !== 'undefined') {
    return templatesDir + '/' + templateName.replace(/\\/g, '/');
  }
  
  // Для Node.js используем path.join
  return path.join(templatesDir, templateName);
}
