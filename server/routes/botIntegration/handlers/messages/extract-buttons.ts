/**
 * @fileoverview Утилита извлечения кнопок из узла
 * Преобразует кнопки узла в формат для Telegram Bot API.
 * Поддерживает action-типы из buttonSchema: goto, url, command, copy_text, web_app и др.
 */

/**
 * Кнопка для inline клавиатуры Telegram
 */
export interface InlineButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Данные callback (для goto/command/selection/complete/default) */
  callbackData?: string;
  /** URL для кнопки-ссылки (action=url) */
  url?: string;
  /** URL для Telegram Mini App (action=web_app) */
  webAppUrl?: string;
  /** Текст для копирования в буфер (action=copy_text) */
  copyText?: string;
  /** Визуальный стиль кнопки (Bot API 9.4): primary=синий, success=зелёный, danger=красный */
  style?: 'primary' | 'success' | 'danger';
}

/**
 * Сырая кнопка из node.data.buttons (соответствует buttonSchema)
 */
interface RawButton {
  /** Уникальный ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Тип действия */
  action?: string;
  /** Целевой узел для goto */
  target?: string;
  /** URL для url-кнопки */
  url?: string;
  /** URL для web_app */
  webAppUrl?: string;
  /** Текст для copy_text */
  copyText?: string;
  /** Кастомный callback_data */
  customCallbackData?: string;
  /** Визуальный стиль кнопки (Bot API 9.4) */
  style?: string;
}

/**
 * Извлекает кнопки из данных узла и преобразует в формат для Telegram API.
 * Читает поля согласно актуальной схеме buttonSchema:
 * - action — строка enum ('url', 'goto', 'command', ...)
 * - url, target, webAppUrl, copyText — отдельные поля верхнего уровня
 *
 * @param nodeData - Данные узла (node.data)
 * @returns Массив кнопок для отправки через sendTelegramMessage
 */
export function extractButtonsFromNode(nodeData: Record<string, unknown>): InlineButton[] {
  const buttons = (nodeData.buttons as RawButton[]) || [];

  return buttons.map(b => {
    const action = b.action ?? 'default';
    // Поле стиля (Bot API 9.4) добавляем к любой ветке, если оно задано
    const styleField = b.style ? { style: b.style as InlineButton['style'] } : {};

    if (action === 'url') {
      return { id: b.id, text: b.text, url: b.url, ...styleField };
    }

    if (action === 'web_app') {
      return { id: b.id, text: b.text, webAppUrl: b.webAppUrl, ...styleField };
    }

    if (action === 'copy_text') {
      return { id: b.id, text: b.text, copyText: b.copyText, ...styleField };
    }

    // goto, command, selection, complete, default — используют callbackData
    const callbackData = b.customCallbackData
      || (action === 'goto' && b.target ? `node:${b.target}` : undefined)
      || b.id;

    return { id: b.id, text: b.text, callbackData, ...styleField };
  });
}
