/**
 * @fileoverview Исключение служебного сообщения Telethon о необязательной SSL-библиотеке.
 */
import type { TerminalLine } from './terminalTypes';

/**
 * Скрывает только сообщение о недоступном необязательном ускорителе OpenSSL.
 * @param line - Строка сохранённого или живого лога
 * @returns Нужно ли показывать строку в терминале
 */
export function isVisibleTerminalNotice(line: TerminalLine): boolean {
  const content = line.content.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '').trim();
  return content !== 'Failed to load SSL library: <class \'OSError\'> (no library called "ssl" found)';
}
