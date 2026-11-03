/**
 * @fileoverview Проверяет сужение авторизации и ссылки в подготовленной MCP-спецификации.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizeMcpSecurity } from './security.mjs';

test('Публичная авторизация сохраняется, включая отсутствие требований', () => {
  assert.deepEqual(normalizeMcpSecurity([], 'GET /public'), []);
  assert.deepEqual(normalizeMcpSecurity(undefined, 'GET /public'), []);
  assert.deepEqual(normalizeMcpSecurity([{}, { cookieAuth: [] }], 'GET /public'), [{}]);
});

test('Альтернативы с cookie удаляются без изменения PAT и исходных данных', () => {
  const source = [{ cookieAuth: [] }, { agentToken: ['read'] }];
  const result = normalizeMcpSecurity(source, 'GET /projects');
  assert.deepEqual(result, [{ agentToken: ['read'] }]);
  result[0].agentToken.push('write');
  assert.deepEqual(source, [{ cookieAuth: [] }, { agentToken: ['read'] }]);
});

test('Неподдерживаемые требования не превращаются в публичный доступ или PAT', () => {
  for (const security of [[{ cookieAuth: [] }], [{ adminCookie: [] }],
    [{ agentToken: [], cookieAuth: [] }], [{ unknownScheme: [] }]]) {
    assert.throws(() => normalizeMcpSecurity(security, 'POST /restricted'), /POST \/restricted/);
  }
});

test('Подготовленная спецификация содержит только пять проверенных чтений и разрешает ссылки авторизации', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('./prepare-spec.mjs', import.meta.url))]);
  const source = JSON.parse(fs.readFileSync(new URL('../../docs/api/openapi.json', import.meta.url)));
  const result = JSON.parse(fs.readFileSync(new URL('./openapi.mcp.json', import.meta.url)));
  let actual = 0;
  /** Фиксированный набор не позволяет тесту повторить ошибку расширения политики. */
  const expected = new Set(['get /api/health', 'get /api/bots', 'get /api/projects',
    'get /api/projects/{id}', 'get /api/projects/{id}/bot/statuses']);
  for (const [path, methods] of Object.entries(result.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation.tags) continue;
      actual += 1;
      assert.ok(expected.delete(`${method} ${path}`), `Неожиданная операция ${method} ${path}`);
      assert.deepEqual(operation.security,
        normalizeMcpSecurity(source.paths[path][method].security ?? source.security, `${method} ${path}`));
      for (const requirement of operation.security) {
        for (const name of Object.keys(requirement)) assert.ok(result.components.securitySchemes[name]);
      }
    }
  }
  assert.equal(actual, 5);
  assert.equal(expected.size, 0);
  assert.deepEqual(Object.keys(result.components.securitySchemes), ['agentToken']);
});
