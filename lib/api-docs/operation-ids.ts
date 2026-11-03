/**
 * @fileoverview Стабильные идентификаторы операций OpenAPI без изменения контрактов маршрутов.
 */
import { createHash } from 'node:crypto';

/** Документ с произвольными полями операций OpenAPI. */
interface OperationDocument {
  /** Пути и методы документа. */
  paths: Record<string, Record<string, unknown>>;
}

/** Допустимые HTTP-операции, исключающие параметры уровня пути. */
const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

/**
 * Добавляет отсутствующие идентификаторы после слияния автоматически и вручную описанных путей.
 * @param document - Исходный документ.
 * @returns Копия документа со стабильными уникальными идентификаторами.
 */
export function withStableOperationIds<T extends OperationDocument>(document: T): T {
  const ids = new Set<string>();
  const paths = Object.fromEntries(Object.entries(document.paths).map(([path, entries]) => {
    const methods = Object.fromEntries(Object.entries(entries).map(([method, value]) => {
      if (!METHODS.has(method) || !value || typeof value !== 'object') return [method, value];
      const operation = value as Record<string, unknown>;
      const slug = path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const suffix = createHash('sha256').update(`${method} ${path}`).digest('hex').slice(0, 16);
      const operationId = typeof operation.operationId === 'string' && operation.operationId
        ? operation.operationId : `${method}_${slug}_${suffix}`;
      if (ids.has(operationId)) throw new Error(`Повторяющийся operationId: ${operationId}`);
      ids.add(operationId);
      return [method, { ...operation, operationId }];
    }));
    return [path, methods];
  }));
  return { ...document, paths };
}
