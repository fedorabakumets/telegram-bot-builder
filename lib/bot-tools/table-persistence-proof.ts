/** @fileoverview Неперечисляемое подтверждение HTTP-записи без изменения старого JSON-массива. */
/** Ключ метаданных, недоступный из обычных пользовательских данных. */
export const TABLE_PERSISTENCE_PROOF = Symbol('table-http-persistence');
/** Подтверждённая область записи. */
export interface TablePersistenceProof {
  /** Запись подтверждена сервером. */ confirmed: true;
  /** Идентификатор проекта. */ projectId: number;
  /** Идентификатор таблицы. */ tableId?: number;
}
/**
 * Проверяет доказательство заголовка по области фактически вызванного маршрута.
 * @param response - Ответ HTTP.
 * @param path - Путь выполненного API-запроса.
 * @returns Проверенное доказательство либо отсутствие.
 */
export function readTablePersistenceProof(response: Response, path: string): TablePersistenceProof | undefined {
  const header = response.headers.get('x-botcraft-persistence');
  if (!header || header.length > 300 || !response.ok || response.status === 202) return undefined;
  const scope = /^\/api\/projects\/([1-9]\d*)\/tables(?:\/([1-9]\d*))?(?:\/|$|\?)/.exec(path);
  if (!scope) return undefined;
  try {
    const proof = JSON.parse(header);
    if (proof.confirmed !== true || !Number.isSafeInteger(proof.projectId) || proof.projectId !== Number(scope[1])) return undefined;
    if (scope[2] && proof.tableId !== Number(scope[2])) return undefined;
    if (proof.tableId !== undefined && (!Number.isSafeInteger(proof.tableId) || proof.tableId <= 0 || scope[2] && proof.tableId !== Number(scope[2]))) return undefined;
    return { confirmed: true, projectId: proof.projectId, ...(proof.tableId === undefined ? {} : { tableId: proof.tableId }) };
  } catch { return undefined; }
}
