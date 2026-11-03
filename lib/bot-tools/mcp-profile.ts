/**
 * @fileoverview Выбор профиля MCP для серверного окружения и stdio.
 */

/**
 * Читает явно выбранный профиль, сохраняя полный режим для существующих клиентов.
 * @param value - Значение BOTCRAFT_MCP_PROFILE из окружения.
 * @returns Проверенное имя профиля.
 */
export function resolveMcpProfile(value = process.env.BOTCRAFT_MCP_PROFILE): 'full' | 'compact' {
  if (value === undefined || value === '' || value === 'full') return 'full';
  if (value === 'compact') return 'compact';
  throw new Error('BOTCRAFT_MCP_PROFILE должен быть full или compact');
}
