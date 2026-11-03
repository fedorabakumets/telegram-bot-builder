/** @fileoverview Проверки офлайн сборки, реальных схем новых таблиц и полноты ссылок OpenAPI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOfflineDocument } from './build-offline-document';
import { auditDocument } from './audit-document';
import { build } from 'esbuild';
import { sourceRouteCandidates } from './source-route-candidates';
import path from 'node:path';
import { reviewDynamicRoutes } from './review-dynamic-routes';

test('Офлайн сборка не импортирует маршруты, БД, хранилище или Redis', async () => {
  const result = await build({ entryPoints: ['lib/api-docs/build-offline-document.ts'], bundle: true,
    platform: 'node', packages: 'external', write: false, metafile: true });
  const forbidden = Object.keys(result.metafile.inputs).filter(file => /server\/(database|storages|redis|routes)\//.test(file));
  assert.deepEqual(forbidden, []);
  const networkDrivers = Object.values(result.metafile.outputs).flatMap(output => output.imports)
    .filter(entry => /^(pg|ioredis|redis|undici|express)(\/|$)/.test(entry.path));
  assert.deepEqual(networkDrivers, []);
});

test('Офлайн документ имеет уникальные ID и разрешённые локальные ссылки', () => {
  const report = auditDocument(buildOfflineDocument());
  assert.deepEqual(report.unresolvedRefs, []);
  assert.deepEqual(report.missingSecuritySchemes, []);
  assert.deepEqual(report.duplicateIds, []);
  assert.deepEqual(report.missingIds, []);
});

test('Каждый объявленный ответ имеет схему либо явно отмеченное отсутствие тела', () => {
  const report = auditDocument(buildOfflineDocument());
  assert.deepEqual(report.missingResponses, []);
  assert.deepEqual(report.intentionalBodylessResponses, ['GET /api/media/s3-proxy/{configId}/* → 502']);
});
test('Новые операции таблиц документируют вход, успешную запись и ошибки', () => {
  const document = buildOfflineDocument();
  for (const [path, method] of [
    ['/api/projects/{id}/tables/{tableId}/cells/edit', 'post'],
    ['/api/projects/{id}/tables/{tableId}/columns/{columnId}/settings', 'put'],
  ]) {
    const operation = document.paths[path][method];
    assert.ok(operation.requestBody);
    assert.ok(operation.responses['200'].content['application/json'].schema);
    assert.ok(operation.responses['400'].content['application/json'].schema);
    assert.ok(operation.responses['404'].content['application/json'].schema);
  }
});
test('Офлайн генерация явно сохраняет непроверенные runtime-only операции', () => {
  const document = buildOfflineDocument({ paths: { '/api/legacy-only': { get: { responses: { 200: { description: 'Старый ответ' } } } } } });
  assert.equal(document.paths['/api/legacy-only'].get['x-offline-unverified'], true);
  assert.ok(document.paths['/api/legacy-only'].get.operationId);
  assert.ok(auditDocument(document).missingResponses.includes('GET /api/legacy-only → 200'));
});

test('Каждый статически разрешённый API-маршрут имеет контракт; динамические mounts не выдаются за проверенные', () => {
  const document = buildOfflineDocument();
  const candidates = sourceRouteCandidates(path.join(process.cwd(), 'server'));
  const missing = candidates.filter(candidate => candidate.resolvedPath?.startsWith('/api/')
    && !['USE', 'ALL', 'HEAD'].includes(candidate.method)
    && !document.paths[candidate.resolvedPath]?.[candidate.method.toLowerCase()]);
  assert.deepEqual(missing, []);
  assert.ok(candidates.some(candidate => candidate.resolvedPath === '/api/projects/{id}/tables/{tableId}/cells/edit'));
  assert.deepEqual(reviewDynamicRoutes(candidates, document.paths).unresolved, []);
});

test('Аудит действительно обнаруживает сломанные ссылки, дубли ID и ответы без схем', () => {
  const report = auditDocument({ paths: {
    '/one': { get: { operationId: 'duplicate', security: [{ removedAuth: [] }], responses: { 200: { description: 'Нет схемы' } } } },
    '/two': { post: { operationId: 'duplicate', responses: { 201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } } } } } },
  } });
  assert.deepEqual(report.duplicateIds, ['duplicate']);
  assert.deepEqual(report.missingSecuritySchemes, ['GET /one: removedAuth']);
  assert.deepEqual(report.unresolvedRefs, ['#/components/schemas/Missing']);
  assert.deepEqual(report.missingResponses, ['GET /one → 200']);
});
