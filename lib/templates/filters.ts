/**
 * @fileoverview Фильтры для Nunjucks шаблонов и утилиты форматирования
 * Предоставляет утилиты для преобразования данных в шаблонах
 */

import { generateBotFatherCommands } from '../commands';

/**
 * Преобразует ID узла в безопасное имя функции Python
 * Заменяет все недопустимые символы на подчёркивание
 *
 * @param str - Строка для преобразования
 * @returns Безопасное имя для функции Python
 *
 * @example
 * "_XfgkKBCCbODb0z7tH7u_" → "_XfgkKBCCbODb0z7tH7u_"
 * "button-123" → "button_123"
 * "start handler" → "start_handler"
 */
export function safeNameFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Преобразует команду Telegram в имя обработчика
 *
 * @param cmd - Команда (например, "/start")
 * @returns Имя функции обработчика
 *
 * @example
 * "/start" → "handle_start_command"
 * "/profile" → "handle_profile_command"
 * "/help" → "handle_help_command"
 */
export function commandToHandlerFilter(cmd: string): string {
  if (typeof cmd !== 'string') return '';
  const command = cmd.replace('/', '');
  return `handle_${command}_command`;
}

/**
 * Экранирует строку для вставки в Python код
 * Экранирует обратные слеши, кавычки, специальные символы
 *
 * @param str - Строка для экранирования
 * @returns Экранированная строка
 *
 * @example
 * 'Hello "World"' → 'Hello \\"World\\"'
 * 'Line1\nLine2' → 'Line1\\nLine2'
 */
export function escapePythonFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\\\')      // Сначала экранируем обратные слеши
    .replace(/"/g, '\\"')        // Экранируем двойные кавычки
    .replace(/\n/g, '\\n')       // Заменяем переносы строк
    .replace(/\r/g, '\\r')       // Заменяем возвраты каретки
    .replace(/\t/g, '\\t');      // Заменяем табуляции
}

/**
 * Проверяет наличие inline кнопок в узле
 *
 * @param node - Объект узла
 * @returns true если есть inline кнопки
 */
export function hasInlineButtonsFilter(node: any): boolean {
  if (!node || !node.data) return false;
  return node.data.keyboardType === 'inline';
}

/**
 * Проверяет наличие автопереходов в узле
 *
 * @param node - Объект узла
 * @returns true если есть автопереход
 */
export function hasAutoTransitionsFilter(node: any): boolean {
  if (!node || !node.data) return false;
  return !!node.data.autoTransitionTo || !!node.data.autoTransitionAfter;
}

/**
 * Проверяет наличие медиа в узле
 *
 * @param node - Объект узла
 * @returns true если есть медиа
 */
export function hasMediaNodesFilter(node: any): boolean {
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
 * Проверяет наличие ссылок на /uploads/ в узле
 *
 * @param node - Объект узла
 * @returns true если есть ссылки на uploads
 */
export function hasUploadImagesFilter(node: any): boolean {
  if (!node || !node.data) return false;
  const data = node.data;

  // Проверяем attachedMedia
  if (Array.isArray(data.attachedMedia)) {
    for (const media of data.attachedMedia) {
      if (typeof media === 'string' && media.startsWith('/uploads/')) {
        return true;
      }
    }
  }

  // Проверяем messageText на наличие ссылок
  if (typeof data.messageText === 'string' && data.messageText.includes('/uploads/')) {
    return true;
  }

  return false;
}

/**
 * Преобразует массив команд для BotFather в строку
 * Использует каноническую реализацию из commands.ts
 *
 * @param nodes - Массив узлов
 * @returns Отформатированные команды
 *
 * @example
 * [{command: "/start", description: "Запустить"}] → "/start - Запустить"
 */
export function formatBotFatherCommands(nodes: any[]): string {
  return generateBotFatherCommands(nodes);
}

/**
 * Форматирует текст для вставки в Python код
 * Использует каноническую реализацию из formatTextForPython.ts
 * Использует тройные кавычки для многострочного текста,
 * одинарные для однострочного
 *
 * @param str - Строка для форматирования
 * @returns Отформатированная строка для Python
 *
 * @example
 * 'Hello' → '"Hello"'
 * 'Line1\nLine2' → '"""Line1\nLine2"""'
 */
export function formatPythonTextFilter(str: string): string {
  return formatTextForPython(str);
}

/**
 * Преобразует JavaScript boolean в Python boolean (True/False)
 *
 * @param value - Значение для преобразования
 * @returns 'True' или 'False'
 *
 * @example
 * true → 'True'
 * false → 'False'
 * null → 'False'
 */
export function toPythonBooleanFilter(value: any): string {
  return value ? 'True' : 'False';
}

/**
 * Генерирует короткий ID для узла (для callback_data)
 * Использует каноническую реализацию из generateUniqueShortId.ts
 *
 * @param nodeId - ID узла
 * @param allNodeIds - Массив всех ID узлов (опционально)
 * @returns Короткий ID (последние 6 символов хеша)
 *
 * @example
 * "node_123" → "a1b2c3"
 */
export function generateShortIdFilter(nodeId: string, allNodeIds: string[] = []): string {
  if (!nodeId) return 'btn';
  return generateUniqueShortId(nodeId, allNodeIds);
}

/**
 * Экранирует строку для использования в Python f-strings
 * Специальная версия для кнопок с галочками
 *
 * @param str - Строка для экранирования
 * @returns Экранированная строка с одинарными кавычками
 *
 * @example
 * 'Button "Test"' → "\\'Button \\\\"Test\\\\\"\\'"
 */
export function escapePythonStringFilter(str: string): string {
  if (typeof str !== 'string') return "''";
  return escapePythonString(str);
}

/**
 * Обрезает строку до указанной длины с конца
 *
 * @param str - Строка для обрезки
 * @param length - Количество символов
 * @returns Обрезанная строка
 *
 * @example
 * "ms_abc123" | slice(-8) → "abc123"
 */
export function sliceFilter(str: string, length: number): string {
  if (typeof str !== 'string') return '';
  if (length >= 0) {
    return str.slice(0, length);
  }
  return str.slice(length);
}

/**
 * Фильтр map для применения функции к каждому элементу массива
 * Поддерживает обращение к свойствам объектов и встроенные атрибуты
 *
 * @param arr - Массив для обработки
 * @param attrOrKwargs - Имя свойства, или kwargs объект {attribute: 'name'}
 * @returns Массив результатов
 *
 * @example
 * [{text: "a"}, {text: "b"}] | map(attribute='text') → ["a", "b"]
 * [['a','b'], ['c']] | map('length') → [2, 1]
 */
export function mapFilter(arr: any[], attrOrKwargs: string | { attribute?: string } | null): any[] {
  if (!Array.isArray(arr)) return [];

  // Nunjucks передаёт именованные аргументы как объект kwargs
  let key: string | null = null;
  if (typeof attrOrKwargs === 'string') {
    key = attrOrKwargs;
  } else if (attrOrKwargs && typeof attrOrKwargs === 'object' && 'attribute' in attrOrKwargs) {
    key = attrOrKwargs.attribute ?? null;
  }

  if (!key) return arr;

  return arr.map(item => {
    if (item == null) return undefined;
    // Для 'length' — возвращаем длину массива или строки
    if (key === 'length') {
      return (item as any).length;
    }
    return (item as any)[key!];
  });
}

/**
 * Фильтр join для объединения массива в строку
 *
 * @param arr - Массив для объединения
 * @param separator - Разделитель
 * @returns Объединённая строка
 *
 * @example
 * ["a", "b", "c"] | join(", ") → "a, b, c"
 */
export function joinFilter(arr: any[], separator = ''): string {
  if (!Array.isArray(arr)) return '';
  return arr.join(separator);
}

/**
 * Фильтр lower для преобразования строки в нижний регистр
 *
 * @param str - Строка для преобразования
 * @returns Строка в нижнем регистре
 */
export function lowerFilter(str: string): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase();
}

/**
 * Фильтр escape для экранирования строки (алиас для escape_python_string)
 * Используется в шаблонах как | escape('python_string')
 *
 * @param str - Строка для экранирования
 * @param type - Тип экранирования
 * @returns Экранированная строка
 */
export function escapeFilter(str: string, type = 'python_string'): string {
  if (type === 'python_string') {
    return escapePythonStringFilter(str);
  }
  return str;
}

// ============================================================================
// Утилиты форматирования (перенесены из bot-generator/format)
// ============================================================================

/**
 * Создает безопасное имя функции Python из идентификатора узла
 */
export function createSafeFunctionName(nodeId: string): string {
  let safeName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^\d/.test(safeName)) safeName = 'node_' + safeName;
  return safeName;
}

/**
 * Экранирует строку для JSON контекста
 */
export function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

/**
 * Экранирует строку для вставки в Python код (двойные кавычки)
 */
export function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

/**
 * Экранирует значение для безопасного использования в Python строках (одинарные кавычки)
 */
export function escapePythonString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'number') return value.toString();
  const escaped = value.toString()
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
  return `'${escaped}'`;
}

/**
 * Форматирует текст для вставки в Python код (тройные кавычки для многострочного)
 */
export function formatTextForPython(text: string): string {
  if (!text) return '""';
  if (text.includes('\n')) return `"""${text}"""`;
  return `"${text.replace(/"/g, '\\"')}"`;
}

/**
 * Генерирует текст кнопки с поддержкой переменных
 */
export function generateButtonText(buttonText: string): string {
  if (buttonText.includes('{') && buttonText.includes('}')) {
    return `replace_variables_in_text("${escapeForPython(buttonText)}", all_user_vars, user_data.get(user_id, {}).get("_variable_filters", {}))`;
  }
  return `"${escapeForPython(buttonText)}"`;
}

/**
 * Генерирует уникальный короткий идентификатор для узла
 */
export function generateUniqueShortId(nodeId: string, allNodeIds: string[]): string {
  if (!nodeId) return 'node';
  if (nodeId.endsWith('_interests')) {
    const prefix = nodeId.replace('_interests', '');
    return prefix.substring(0, Math.min(6, prefix.length));
  }
  const baseShortId = nodeId.slice(-10).replace(/^_+/, '');
  const conflicts = allNodeIds.filter(id => id.slice(-10).replace(/^_+/, '') === baseShortId && id !== nodeId);
  if (conflicts.length === 0) return baseShortId;
  return nodeId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}

/**
 * Возвращает строку parse_mode для Telegram API
 */
export function getParseMode(formatMode: string): string {
  if (!formatMode || formatMode.trim() === '' || formatMode.trim().toLowerCase() === 'none') return '';
  if (formatMode.toLowerCase() === 'html') return ', parse_mode=ParseMode.HTML';
  if (formatMode.toLowerCase() === 'markdown') return ', parse_mode=ParseMode.MARKDOWN';
  return '';
}

/**
 * Удаляет HTML теги из текста
 */
export function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Конвертирует JavaScript boolean в Python boolean ('True'/'False')
 */
export function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}
