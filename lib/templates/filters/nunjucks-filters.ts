/**
 * @fileoverview Функции-фильтры для Nunjucks шаблонов
 */

import { generateBotFatherCommands } from '../../commands';
import { escapePythonString } from './python-formatters';
import { formatTextForPython } from './python-formatters';
import { generateUniqueShortId } from './python-formatters';

/**
 * Преобразует ID узла в безопасное имя функции Python
 */
export function safeNameFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Преобразует команду Telegram в имя обработчика
 */
export function commandToHandlerFilter(cmd: string): string {
  if (typeof cmd !== 'string') return '';
  const command = cmd.replace('/', '');
  return `handle_${command}_command`;
}

/**
 * Экранирует строку для вставки в Python код
 */
export function escapePythonFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Проверяет наличие inline кнопок в узле
 */
export function hasInlineButtonsFilter(node: any): boolean {
  if (!node || !node.data) return false;
  return node.data.keyboardType === 'inline';
}

/**
 * Проверяет наличие автопереходов в узле (для Nunjucks фильтра)
 */
export function hasAutoTransitionsFilter(node: any): boolean {
  if (!node || !node.data) return false;
  return !!node.data.autoTransitionTo || !!node.data.autoTransitionAfter;
}

/**
 * Проверяет наличие медиа только по data полям одного узла (для Nunjucks фильтра has_media).
 * Работает на уровне одного узла, а не массива.
 * Для проверки массива узлов используйте `hasMediaNodes` из node-predicates.ts.
 */
export function hasMediaNodesByData(node: any): boolean {
  if (!node || !node.data) return false;
  const data = node.data;
  return !!(
    data.attachedMedia?.length ||
    data.photoInputVariable ||
    data.videoInputVariable ||
    data.audioInputVariable ||
    data.documentInputVariable
  );
}

/**
 * @deprecated Используйте hasMediaNodesByData
 */
export const hasMediaNodesFilter = hasMediaNodesByData;

/**
 * Проверяет наличие ссылок на /uploads/ в узле
 */
export function hasUploadImagesFilter(node: any): boolean {
  if (!node || !node.data) return false;
  const data = node.data;
  if (Array.isArray(data.attachedMedia)) {
    for (const media of data.attachedMedia) {
      if (typeof media === 'string' && media.startsWith('/uploads/')) return true;
    }
  }
  if (typeof data.messageText === 'string' && data.messageText.includes('/uploads/')) return true;
  return false;
}

/**
 * Преобразует массив команд для BotFather в строку
 */
export function formatBotFatherCommands(nodes: any[]): string {
  return generateBotFatherCommands(nodes);
}

/**
 * Форматирует текст для вставки в Python код
 */
export function formatPythonTextFilter(str: string): string {
  return formatTextForPython(str);
}

/**
 * Преобразует JavaScript boolean в Python boolean
 */
export function toPythonBooleanFilter(value: any): string {
  return value ? 'True' : 'False';
}

/**
 * Генерирует короткий ID для узла (для callback_data)
 */
export function generateShortIdFilter(nodeId: string, allNodeIds: string[] = []): string {
  if (!nodeId) return 'btn';
  return generateUniqueShortId(nodeId, allNodeIds);
}

/**
 * Экранирует строку для использования в Python f-strings
 */
export function escapePythonStringFilter(str: string): string {
  if (typeof str !== 'string') return "''";
  return escapePythonString(str);
}

/**
 * Обрезает строку до указанной длины
 */
export function sliceFilter(str: string, length: number): string {
  if (typeof str !== 'string') return '';
  if (length >= 0) return str.slice(0, length);
  return str.slice(length);
}

/**
 * Фильтр map для применения функции к каждому элементу массива
 */
export function mapFilter(arr: any[], attrOrKwargs: string | { attribute?: string } | null): any[] {
  if (!Array.isArray(arr)) return [];
  let key: string | null = null;
  if (typeof attrOrKwargs === 'string') {
    key = attrOrKwargs;
  } else if (attrOrKwargs && typeof attrOrKwargs === 'object' && 'attribute' in attrOrKwargs) {
    key = attrOrKwargs.attribute ?? null;
  }
  if (!key) return arr;
  return arr.map(item => {
    if (item == null) return undefined;
    if (key === 'length') return (item as any).length;
    return (item as any)[key!];
  });
}

/**
 * Фильтр join для объединения массива в строку
 */
export function joinFilter(arr: any[], separator = ''): string {
  if (!Array.isArray(arr)) return '';
  return arr.join(separator);
}

/**
 * Фильтр lower для преобразования строки в нижний регистр
 */
export function lowerFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase();
}

/**
 * Фильтр escape (алиас для escape_python_string)
 */
export function escapeFilter(str: string, type = 'python_string'): string {
  if (type === 'python_string') return escapePythonStringFilter(str);
  return str;
}
