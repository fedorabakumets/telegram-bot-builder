/** @fileoverview Сохранение клавиатуры сообщения при изменении только текста. */
import { extractButtonsFromNode } from './extract-buttons';
import { buildInlineKeyboard } from './send-telegram-message';

/**
 * Разрешает переданные или сохранённые кнопки; пустой массив явно снимает клавиатуру.
 * @param messageData - Сохранённые данные сообщения.
 * @param buttons - Новые кнопки либо отсутствие изменения.
 * @param buttonsPerRow - Новая ширина ряда либо сохранённая.
 * @returns Клавиатура Telegram и данные для сохранения и события.
 */
export function resolveEditKeyboard(messageData: unknown, buttons?: unknown[], buttonsPerRow?: number) {
  const saved = messageData && typeof messageData === 'object' ? messageData as Record<string, unknown> : {};
  const effectiveButtons = buttons ?? (Array.isArray(saved.buttons) ? saved.buttons : []);
  const effectivePerRow = buttonsPerRow ?? (typeof saved.buttonsPerRow === 'number' ? saved.buttonsPerRow : 0);
  const raw = saved.reply_markup as { inline_keyboard?: unknown[][] } | undefined;
  const replyMarkup = buttons === undefined && buttonsPerRow === undefined && Array.isArray(raw?.inline_keyboard)
    ? raw as { inline_keyboard: any[][] }
    : effectiveButtons.length ? buildInlineKeyboard(extractButtonsFromNode({ buttons: effectiveButtons }), effectivePerRow)
      : { inline_keyboard: [] as any[][] };
  return { buttons: effectiveButtons, buttonsPerRow: effectivePerRow, replyMarkup };
}
