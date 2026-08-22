/**
 * @fileoverview Группировка инстансов restore по projectId для параллельного подъёма.
 * @module server/bots/restoreGrouping
 */

/** Минимальное описание инстанса для группировки */
export interface RestoreGroupInstance {
  id: number;
  projectId: number;
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
