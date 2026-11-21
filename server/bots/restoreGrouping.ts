/**
 * @fileoverview Группировка инстансов restore по projectId для параллельного подъёма.
 * @module server/bots/restoreGrouping
 */

/** Минимальное описание инстанса для группировки */
export interface RestoreGroupInstance {
  /** Идентификатор сохранённого экземпляра. */
  id: number;
  /** Проект для независимого набора кандидатов восстановления. */
  projectId: number;
  /** Токен либо старый экземпляр без привязки. */
  tokenId: number | null;
}

/**
 * Группирует инстансы по projectId, сохраняя порядок внутри каждой группы
 * (как в исходном массиве allInstances.filter(...)).
 *
 * @param instances - Отфильтрованный список кандидатов restore
 * @returns Массив групп — по одной на проект
 */
export function groupRestoreInstancesByProject<T extends RestoreGroupInstance>(
  instances: T[],
): T[][] {
  const byProject = new Map<number, T[]>();

  for (const inst of instances) {
    const list = byProject.get(inst.projectId);
    if (list) {
      list.push(inst);
    } else {
      byProject.set(inst.projectId, [inst]);
    }
  }

  return [...byProject.values()];
}

/**
 * Запускает независимые проекты параллельно с исходным порядком кандидатов в группах.
 * Фактические старты проходят через общий ограничитель startBot: максимум пять и интервал 250 мс.
 * @param instances - Кандидаты основного или контрольного восстановления.
 * @param restoreGroup - Обработчик одной группы с ограниченным параллелизмом.
 * @returns Результат каждой группы в порядке первого появления проекта.
 */
export function runRestoreProjects<T extends RestoreGroupInstance, R>(
  instances: T[], restoreGroup: (group: T[]) => Promise<R>,
): Promise<R[]> {
  return Promise.all(groupRestoreInstancesByProject(instances).map(restoreGroup));
}

/** Общий ограниченный обход доступен также для reconcile и других источников запуска. */
export { mapRestoreCandidates } from './boundedBotTasks';
