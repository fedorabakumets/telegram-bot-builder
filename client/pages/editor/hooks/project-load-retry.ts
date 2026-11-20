/** @fileoverview Ограниченное автоматическое восстановление загрузки проекта после перезапуска сервера. */
import { ProjectLoadError } from './load-editor-project';
/** Число повторов покрывает обычный холодный запуск локального сервера продолжительностью до 43 секунд. */
const MAX_PROJECT_RETRIES = 12;
/** Повторяет лишь временные сбои; отсутствие проекта и отказ доступа не повторяются. @param failures - Уже выполненные повторы. @param error - Ошибка запроса. @returns Нужна ли повторная попытка. */
export function retryProjectLoad(failures: number, error: unknown): boolean {
  if (failures >= MAX_PROJECT_RETRIES) return false;
  if (error instanceof ProjectLoadError) return [408, 425, 429, 500, 502, 503, 504].includes(error.status);
  return error instanceof TypeError;
}
/** Увеличивает паузу до четырёх секунд, не перегружая перезапускающийся сервер. @param attempt - Номер повтора. @returns Задержка в миллисекундах. */
export function projectLoadRetryDelay(attempt: number): number { return Math.min(1000 * 2 ** attempt, 4000); }
