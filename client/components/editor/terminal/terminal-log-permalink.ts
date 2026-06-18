/**
 * @fileoverview Постоянные ссылки на строки лога терминала
 * @module terminal/terminal-log-permalink
 */

/** Имя query-параметра ID строки лога */
export const TERMINAL_LOG_PARAM = 'log';

/**
 * Читает ID строки лога из URL (?log=)
 * @returns ID строки или null
 */
export function getLogIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(TERMINAL_LOG_PARAM);
}

/**
 * Удаляет параметр log из URL
 */
export function clearLogFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(TERMINAL_LOG_PARAM);
  window.history.replaceState(null, '', url.toString());
}

/**
 * Собирает постоянную ссылку на строку лога терминала
 * @param lineId - ID строки
 * @param projectId - ID проекта (из пути URL)
 * @param tokenId - ID токена бота
 * @returns Полный URL
 */
export function buildTerminalLogPermalink(lineId: string, tokenId: number): string {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', 'terminal');
  url.searchParams.set('bot', String(tokenId));
  url.searchParams.set(TERMINAL_LOG_PARAM, lineId);
  return url.toString();
}
