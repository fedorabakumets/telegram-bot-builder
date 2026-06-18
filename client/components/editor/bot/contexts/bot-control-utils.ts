/**
 * @fileoverview Утилиты для компонента bot-control
 *
 * Содержит вспомогательные функции для работы с ботами.
 *
 * @module bot-control-utils
 */

import type { QueryClient } from '@tanstack/react-query';

/** Минимальные поля токена для формирования имени бота */
interface BotNameToken {
  /** Имя токена в проекте */
  name?: string | null;
  /** Имя бота из Telegram getMe */
  botFirstName?: string | null;
  /** Username бота из Telegram getMe */
  botUsername?: string | null;
}

/**
 * Форматирование времени выполнения
 * @param seconds - Количество секунд
 * @returns Отформатированная строка времени
 */
export function formatExecutionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);
  parts.push(`${secs}с`);

  return parts.join(' ');
}

/**
 * Формирует отображаемое имя бота для вкладки терминала.
 * Приоритет: botFirstName (@botUsername) > botFirstName > name > fallback
 * @param token - Данные токена
 * @param fallback - Запасное значение
 * @returns Отображаемое имя бота
 */
export function getBotDisplayName(
  token: BotNameToken,
  fallback = 'Бот',
): string {
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botFirstName) return token.botFirstName;
  if (token.name) return token.name;
  return fallback;
}

/**
 * Ищет токен в кэше React Query и возвращает отображаемое имя бота
 * @param queryClient - Клиент React Query
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns Имя бота или запасной вариант Bot #id
 */
export function resolveBotDisplayNameFromCache(
  queryClient: QueryClient,
  projectId: number,
  tokenId: number,
): string {
  const tokens = queryClient.getQueryData<Array<BotNameToken & { id: number }>>(
    [`/api/projects/${projectId}/tokens`],
  );
  const token = tokens?.find(t => t.id === tokenId);
  if (token) return getBotDisplayName(token, `Bot #${tokenId}`);
  return `Bot #${tokenId}`;
}
