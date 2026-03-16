/**
 * @fileoverview Экспорт модуля импортов
 * @deprecated Модуль устарел после миграции на Jinja2 шаблоны
 *
 * Примечание: Функция generatePythonImports удалена после миграции на Jinja2.
 * Импорт теперь генерируется через шаблон:
 * - lib/templates/imports/imports.py.jinja2
 *
 * Для генерации импортов используйте:
 * import { generateImports } from '../templates/typed-renderer';
 */

// Примечание: отдельные функции генерации импортов могут быть переписаны
// для использования с Jinja2 шаблонами
export { generateBaseImports, type BaseImportGeneratorOptions } from './generate-base-imports';
export { generateCommandImports } from './generate-command-imports';
export { generateUrlImageImports, generateDatetimeImports, generateMediaGroupImports } from './generate-media-imports';
export { generateParseModeImports } from './generate-parse-mode-imports';
export { generateTelegramBadRequestImports } from './generate-exception-imports';
