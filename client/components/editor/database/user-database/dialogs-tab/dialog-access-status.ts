/** @fileoverview Единое состояние доступа из записи диалога и клиентского кэша. */
import type { GroupAccessData } from '../hooks/group-sync-request';

/** Сохранённые признаки доступа конкретного бота к собеседнику. */
interface DialogAccessEntry {
  /** Групповой чат вместо личной переписки. */ isGroup?: boolean;
  /** Подтверждённая блокировка бота пользователем. */ isBlocked?: boolean | null;
  /** Результат последней серверной проверки. */ accessStatus?: GroupAccessData['status'];
}

/**
 * Показывает сохранённую блокировку без необходимости сначала открыть переписку.
 * @param entry - Данные строки списка
 * @param cached - Состояние проверки в клиентском кэше
 * @returns Состояние для общей цветной метки
 */
export function dialogAccessStatus(entry: DialogAccessEntry, cached?: GroupAccessData['status']): GroupAccessData['status'] | undefined {
  if (!entry.isGroup && entry.isBlocked) return 'kicked';
  return cached && cached !== 'unknown' ? cached : entry.accessStatus;
}
