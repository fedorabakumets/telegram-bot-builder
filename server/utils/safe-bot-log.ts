/** @fileoverview Маскирование секретов в новых и ранее сохранённых строках журнала бота. */
import { redactSecrets } from './redactSecrets';
/**
 * Возвращает безопасную копию строки журнала, сохраняя даты и служебные идентификаторы.
 * @param log - Исходная строка журнала или данные перед сохранением.
 * @returns Копия с замаскированными кодами входа и прочими секретами.
 */
export function safeBotLog<T extends { /** Текст строки журнала. */ content: string }>(log: T): T {
  return { ...log, content: redactSecrets(log.content) };
}
