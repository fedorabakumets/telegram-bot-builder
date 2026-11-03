/** @fileoverview Проверка локальных ссылок, идентификаторов и полноты явно описанных ответов OpenAPI. */
/**
 * Возвращает проверяемые дефекты без объявления неизвестных payload точными схемами.
 * @param document - Документ OpenAPI.
 * @returns Списки неразрешённых ссылок и недокументированных ответов.
 */
export function auditDocument(document: Record<string, any>) {
  const unresolvedRefs: string[] = [];
  const missingResponses: string[] = [];
  const ids = new Set<string>();
  const duplicateIds: string[] = [];
  const missingIds: string[] = [];
  const intentionalBodylessResponses: string[] = [];
  const missingSecuritySchemes: string[] = [];
  /** Проверяет именованные схемы авторизации, которые не представлены обычными $ref. */
  function checkSecurity(requirements: unknown, label: string): void {
    if (!Array.isArray(requirements)) return;
    for (const requirement of requirements) {
      if (!requirement || typeof requirement !== 'object') continue;
      for (const name of Object.keys(requirement)) {
        if (!document.components?.securitySchemes?.[name]) missingSecuritySchemes.push(`${label}: ${name}`);
      }
    }
  }
  checkSecurity(document.security, 'document');
  /** Проверяет JSON Pointer, включая экранированные сегменты. */
  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const entry = value as Record<string, unknown>;
    if (typeof entry.$ref === 'string' && entry.$ref.startsWith('#/')) {
      let found: any = document;
      for (const part of entry.$ref.slice(2).split('/')) found = found?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
      if (found === undefined) unresolvedRefs.push(entry.$ref);
    }
    Object.values(entry).forEach(visit);
  }
  visit(document);
  for (const [route, methods] of Object.entries(document.paths ?? {}) as Array<[string, Record<string, any>]>) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!/^(get|post|put|patch|delete|head|options|trace)$/.test(method)) continue;
      const label = `${method.toUpperCase()} ${route}`;
      checkSecurity(operation.security, label);
      if (!operation.operationId) missingIds.push(label);
      else if (ids.has(operation.operationId)) duplicateIds.push(operation.operationId);
      else ids.add(operation.operationId);
      for (const [status, response] of Object.entries(operation.responses ?? {}) as Array<[string, any]>) {
        if (response['x-response-body'] === 'none') { intentionalBodylessResponses.push(`${label} → ${status}`); continue; }
        if (['204', '304'].includes(status) || method === 'head' || response.$ref) continue;
        if (!Object.values(response.content ?? {}).some((media: any) => media.schema)) missingResponses.push(`${label} → ${status}`);
      }
    }
  }
  return { unresolvedRefs: [...new Set(unresolvedRefs)], missingSecuritySchemes, missingIds, duplicateIds, missingResponses, intentionalBodylessResponses };
}
