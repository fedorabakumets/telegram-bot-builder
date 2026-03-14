/**
 * @fileoverview Утилита для получения пути к директории шаблонов
 * Работает как в Node.js так и при сборке Vite
 */

import * as path from 'path';

/**
 * Получает абсолютный путь к директории шаблонов
 * 
 * @returns Абсолютный путь к lib/bot-generator/templates/
 */
export function getTemplatesDir(): string {
  // Используем process.cwd() для получения корня проекта
  // Это работает в tsx/esbuild
  const projectRoot = process.cwd();
  return path.join(projectRoot, 'lib', 'bot-generator', 'templates');
}

/**
 * Получает абсолютный путь к файлу шаблона
 * 
 * @param templateName - Имя шаблона относительно templates/
 * @returns Абсолютный путь к шаблону
 */
export function getTemplatePath(templateName: string): string {
  const templatesDir = getTemplatesDir();
  return path.join(templatesDir, templateName);
}
