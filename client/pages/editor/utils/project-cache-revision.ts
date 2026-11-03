/** @fileoverview Монотонное принятие сохранённых проектов и безопасный откат оптимистичного кеша. */
import type { BotProject } from '@shared/schema';

/** Минимальные поля подтверждённого снимка. */
interface VersionedProject {
  /** Идентификатор проекта. */
  id: number;
  /** Ревизия сохранения, отсутствующая у старого API. */
  revision?: number;
}

/**
 * Отделяет подтверждённую серверную квитанцию от произвольного успешного HTTP-ответа.
 * @param value - Ответ сохранения.
 * @returns Признак подтверждённого снимка проекта.
 */
export function isSavedProjectReceipt(value: unknown): value is BotProject {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as { id?: number; revision?: number; persistence?: { confirmed?: boolean } };
  return Number.isSafeInteger(receipt.id) && receipt.id! > 0
    && Number.isSafeInteger(receipt.revision) && receipt.revision! >= 0 && receipt.persistence?.confirmed === true;
}

/**
 * Не заменяет уже принятую новую ревизию поздним ответом или старым снимком отката.
 * @param current - Текущее значение кеша.
 * @param candidate - Ответ сервера либо снимок до оптимистичного изменения.
 * @returns Более новая подтверждённая ревизия, при равенстве кандидат.
 */
export function preferNewerProject<T extends VersionedProject>(current: T | undefined, candidate: T): T {
  if (current?.id === candidate.id && Number.isSafeInteger(current.revision)
    && (!Number.isSafeInteger(candidate.revision) || current.revision! > candidate.revision!)) return current;
  return candidate;
}

/**
 * Откатывает только существовавшие записи, сохраняя более новые подтверждённые снимки.
 * @param current - Текущий список проектов.
 * @param previous - Список перед оптимистичным изменением.
 * @returns Совместимый список без понижения ревизий.
 */
export function rollbackProjectList<T extends VersionedProject>(current: T[] | undefined, previous: T[]): T[] {
  if (!current) return previous;
  return current.map(project => {
    const old = previous.find(item => item.id === project.id);
    return old ? preferNewerProject(project, old) : project;
  });
}
