/**
 * @fileoverview Утилита для получения пути к директории шаблонов
 * Работает как в Node.js так и при сборке Vite
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Получает абсолютный путь к директории шаблонов
 * 
 * @returns Абсолютный путь к lib/bot-generator/templates/
 */
export function getTemplatesDir(): string {
  try {
    // Для Node.js с ES modules
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      return __dirname;
    }
  } catch (e) {
    // Игнорируем ошибки import.meta
  }
  
  // Fallback для CommonJS или когда import.meta недоступен
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  
  // Fallback для Vite/browser - используем относительный путь
  throw new Error('getTemplatesDir() works only in Node.js environment');
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
