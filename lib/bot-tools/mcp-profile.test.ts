/**
 * @fileoverview Проверки явного выбора профиля MCP и совместимого значения по умолчанию.
 */
import { describe, expect, it } from 'vitest';
import { resolveMcpProfile } from './mcp-profile.ts';

describe('Профиль MCP', () => {
  it('сохраняет полный профиль и разрешает явный компактный', () => {
    expect(resolveMcpProfile('')).toBe('full');
    expect(resolveMcpProfile('full')).toBe('full');
    expect(resolveMcpProfile('compact')).toBe('compact');
  });
  it('не маскирует ошибочную настройку', () => {
    expect(() => resolveMcpProfile('compcat')).toThrow('BOTCRAFT_MCP_PROFILE');
  });
});
