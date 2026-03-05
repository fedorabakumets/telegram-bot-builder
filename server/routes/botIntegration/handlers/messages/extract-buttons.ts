/**
 * @fileoverview Утилита извлечения кнопок из узла
 * 
 * Преобразует кнопки узла в формат для Telegram API.
 */

/**
 * Кнопка для inline клавиатуры
 */
export interface InlineButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Данные callback для кнопки */
  callbackData?: string;
  /** URL для кнопки */
  url?: string;
}

/**
 * Извлекает кнопки из данных узла
 * 
 * @param nodeData - Данные узла
 * @returns Массив кнопок
 */
export function extractButtonsFromNode(nodeData: Record<string, unknown>): InlineButton[] {
  const buttons = nodeData.buttons as Array<{
    id: string;
    text: string;
    action?: { type: string; nodeId?: string; url?: string };
  }> || [];

  return buttons.map(b => ({
    id: b.id,
    text: b.text,
    callbackData: b.action?.type === 'navigate' ? `node:${b.action.nodeId}` : undefined,
    url: b.action?.type === 'url' ? b.action.url : undefined,
  }));
}
