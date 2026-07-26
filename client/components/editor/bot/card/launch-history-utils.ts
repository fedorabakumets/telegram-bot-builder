/**
 * @fileoverview Утилиты отображения истории запусков
 * @module bot/card/launch-history-utils
 */

import { formatExecutionTime } from '../contexts/bot-control-utils';

/** Мета бейджа статуса */
export interface LaunchStatusMeta {
  /** Короткий ярлык */
  label: string;
  /** Классы бейджа */
  badgeClass: string;
  /** Текст под карточкой */
  footer: string;
}

/**
 * Мета статуса запуска для UI в стиле Railway
 * @param status - running | stopped | error
 * @param errorMessage - Текст ошибки
 * @returns Мета для бейджа и футера
 */
export function getLaunchStatusMeta(
  status: string,
  errorMessage?: string | null,
): LaunchStatusMeta {
  if (status === 'running') {
    return {
      label: 'Онлайн',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      footer: 'Бот работает',
    };
  }
  if (status === 'error') {
    return {
      label: 'Ошибка',
      badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
      footer: errorMessage?.trim() || 'Запуск завершился с ошибкой',
    };
  }
  return {
    label: 'Остановлен',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    footer: 'Запуск остановлен',
  };
}

/**
 * Относительное время на русском («5 мин назад», «вчера»)
 * @param date - Дата
 * @returns Строка
 */
export function formatRelativeRu(date: Date | string | null): string {
  if (!date) return '—';
  const t = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return 'только что';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Длительность запуска в секундах
 * @param startedAt - Старт
 * @param stoppedAt - Стоп
 * @returns Секунды или null
 */
export function getLaunchDurationSec(
  startedAt: Date | string | null,
  stoppedAt: Date | string | null,
): number | null {
  if (!startedAt || !stoppedAt) return null;
  return Math.floor(
    (new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
}

/**
 * Подпись длительности для футера
 * @param startedAt - Старт
 * @param stoppedAt - Стоп
 * @returns Строка или null
 */
export function formatLaunchDurationLabel(
  startedAt: Date | string | null,
  stoppedAt: Date | string | null,
): string | null {
  const sec = getLaunchDurationSec(startedAt, stoppedAt);
  if (sec == null) return null;
  return formatExecutionTime(sec);
}
