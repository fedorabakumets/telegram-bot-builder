/** @fileoverview Узкие проверки документированных контрактов сессий, административного журнала и неоднородных hooks. */
import { describe, expect, it } from 'vitest';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerProfileSessionPaths } from '../../server/swagger/paths/profile-session-paths';
import { registerAdminProjectAuditPaths } from '../../server/swagger/paths/admin-project-audit-paths';
import { registerHooksPaths } from '../../server/swagger/paths/hooks-paths';
import { ProfileSessionsSchema, SessionUnauthorizedSchema, OtherSessionsRevokedSchema } from '../../server/swagger/schemas/profile-sessions';
import { AdminAuditResponseSchema } from '../../server/swagger/schemas/admin-project-audit';
import { build } from 'esbuild';
/** Генерирует только проверяемые маршруты. @returns Документ без среды приложения. */
function document() {
  const registry = new OpenAPIRegistry(); registerProfileSessionPaths(registry); registerAdminProjectAuditPaths(registry); registerHooksPaths(registry, []);
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.3', info: { title: 'Проверка', version: '1' } });
}
describe('контракты сессий, административного журнала и hooks', () => {
  it('сессии не документируют внутренний sessionId и описывают реальные ошибки', () => {
    const doc = document();
    const fields = (doc.components!.schemas!.ProfileSession as any).properties;
    expect(fields.sessionId).toBeUndefined(); expect(fields['connect.sid']).toBeUndefined();
    expect(ProfileSessionsSchema.parse({ sessions: [] })).toEqual({ sessions: [] });
    expect(SessionUnauthorizedSchema.safeParse({ success: false, message: 'Требуется авторизация через Telegram' }).success).toBe(true);
    expect(OtherSessionsRevokedSchema.safeParse({ success: true, revoked: 3 }).success).toBe(true);
    expect(doc.paths['/api/profile/sessions/{id}'].delete!.parameters).toHaveLength(1);
    for (const method of ['get', 'delete'] as const) expect(doc.paths['/api/profile/sessions'][method]!.responses['503'].content).toBeDefined();
  });
  it('журнал принимает пустой items и не обещает несуществующий404', () => {
    const route = document().paths['/admin/api/projects/{id}/audit'].get!;
    expect(AdminAuditResponseSchema.safeParse({ items: [] }).success).toBe(true);
    expect(route.responses['404']).toBeUndefined();
    expect(route.responses['400'].content).toBeDefined(); expect(route.responses['500'].content).toBeDefined();
    expect(route.security).toEqual([{ adminCookie: [] }]);
  });
  it('секретный маршрут остаётся административным и не содержит примеров секретов', () => {
    const route = document().paths['/admin/api/projects/{id}/secrets/bot-token/{tokenId}'].get!;
    expect(route.security).toEqual([{ adminCookie: [] }]); expect(route.parameters).toHaveLength(2);
    expect(JSON.stringify(route)).not.toContain('example'); expect(route.responses['400'].content).toBeDefined();
  });
  it('hooks допускают произвольные статусы, JSON и текст и различают таймауты', () => {
    const doc = document();
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const route = doc.paths['/api/hooks/{projectId}/{path}'][method]!;
      expect(route.responses.default.content['*/*']).toBeDefined();
      expect(route.responses['200'].content['application/json'].schema).toBeDefined();
      expect(route.responses['502'].description).toContain('35 секунд'); expect(route.responses['504'].description).toContain('30 секунд');
    }
  });
  it('схемы не импортируют исполняемые обработчики или инфраструктуру', async () => {
    const result = await build({ entryPoints: ['server/swagger/paths/auth-session-paths.ts', 'server/swagger/paths/admin-project-audit-paths.ts', 'server/swagger/paths/hooks-paths.ts'], bundle: true, platform: 'node', packages: 'external', write: false, metafile: true, outdir: 'unused' });
    expect(Object.keys(result.metafile.inputs).filter(path => /server\/(routes|database|storages|redis)\//.test(path))).toEqual([]);
  });
});
