/**
 * @fileoverview Фильтры для Nunjucks шаблонов
 * Предоставляет утилиты для преобразования данных в шаблонах
 */

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
 *
 * @param nodes - Массив узлов
 * @returns Отформатированные команды
 *
 * @example
 * [{command: "/start", description: "Запустить"}] → "/start - Запустить"
 */
export function formatBotFatherCommands(nodes: any[]): string {
  if (!Array.isArray(nodes)) return '';
  
  return nodes
    .filter(node => node.type === 'start' || node.type === 'command')
    .filter(node => node.data?.showInMenu && node.data?.command)
    .map(node => `${node.data.command} - ${node.data.description || ''}`)
    .join('\n');
}
