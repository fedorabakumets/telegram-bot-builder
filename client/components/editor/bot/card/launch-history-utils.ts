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
 * Выбирает подтверждённое состояние процесса, сохраняя приоритет свежего ответа исполнителя.
 * @param status - Последнее состояние исполнителя.
 * @param fallbackRunning - Запасное состояние родительской панели.
 * @param stopping - Подтверждённая отправка команды остановки текущего бота.
 * @returns Состояние процесса без предположения о завершённой остановке.
 */
export function resolveLaunchLiveStatus(status: string | undefined, fallbackRunning: boolean, stopping = false): 'running' | 'stopping' | 'stopped' | 'error' | 'unknown' | undefined {
  if (status === 'unknown' || status === 'stopped' || status === 'error') return status;
  if (stopping || status === 'stopping') return 'stopping';
  if (status === 'running') return status;
  return fallbackRunning ? 'running' : undefined;
}

/**
 * Мета статуса запуска для UI в стиле Railway
 * @param status - running | stopped | error
 * @param errorMessage - Текст ошибки
 * @param frozen - Ограничение Telegram, не определяющее состояние процесса
 * @returns Мета для бейджа и футера
 */
export function getLaunchStatusMeta(
  status: string,
  errorMessage?: string | null,
  frozen = false,
): LaunchStatusMeta {
  if (status === 'unknown') return {
    label: 'Нет связи',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    footer: frozen ? 'Telegram ограничил бота. Состояние процесса неизвестно.' : 'Состояние процесса неизвестно: нет связи с исполнителем.',
  };
  if (status === 'stopping') return {
    label: 'Останавливается',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    footer: frozen ? 'Telegram ограничил бота. Автоматическая остановка ещё не подтверждена.' : 'Ожидается подтверждение остановки исполнителем.',
  };
  if (status === 'running') {
    return {
      label: frozen ? 'Процесс работает' : 'Онлайн',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      footer: frozen ? 'Telegram ограничил бота. Процесс ещё работает; ожидается автоматическая остановка.' : 'Бот работает',
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
    footer: frozen ? 'Telegram ограничил бота. Процесс остановлен.' : 'Запуск остановлен',
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
