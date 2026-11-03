/**
 * @fileoverview Сужает требования авторизации OpenAPI до поддерживаемых MCP вариантов.
 */

/**
 * Оставляет публичный доступ и альтернативы только с PAT без ослабления требований.
 * @param {Array<Record<string, string[]>> | undefined} security - Требования операции или документа.
 * @param {string} operation - Метод и путь для сообщения об ошибке.
 * @returns {Array<Record<string, string[]>>} Поддерживаемые альтернативы авторизации.
 */
export function normalizeMcpSecurity(security, operation) {
  if (security === undefined || security.length === 0) return [];
  const supported = security.filter((requirement) =>
    Object.keys(requirement).every((name) => name === 'agentToken'));
  if (supported.length === 0) {
    throw new Error(`Операция ${operation} не поддерживает авторизацию MCP через PAT`);
  }
  return supported.map((requirement) => structuredClone(requirement));
}
