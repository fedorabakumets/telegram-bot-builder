/** @fileoverview Узкая проверка закрытой политики второго OpenAPI-адаптера. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mayExposeOperation } from './exposure.mjs';

test('Секреты и управление доступом не открываются даже при разрешённом теге', () => {
  for (const route of ['/api/agent-tokens', '/api/projects/{id}/tokens', '/api/projects/{id}/tokens/{tokenId}/env', '/api/projects/{id}/tokens/{tokenId}/env/reveal', '/api/projects/{id}/collaborators', '/admin/api/projects']) {
    assert.equal(mayExposeOperation(route, { tags: ['projects'] }, 'get'), false, route);
  }
});
test('Неизвестные теги закрыты, смешанный admin-тег не обходит политику', () => {
  assert.equal(mayExposeOperation('/api/projects', { tags: ['projects', 'admin'] }, 'get'), false);
  assert.equal(mayExposeOperation('/api/new', { tags: ['unknown'] }, 'get'), false);
  assert.equal(mayExposeOperation('/api/projects', { tags: ['projects'] }, 'get'), true);
  assert.equal(mayExposeOperation('/api/new', null, 'get'), false);
  assert.equal(mayExposeOperation('/api/projects/new-secret', { tags: ['projects'] }, 'get'), false);
  assert.equal(mayExposeOperation('/api/projects', { tags: ['projects'] }, 'post'), false);
  assert.equal(mayExposeOperation('/api/projects', { tags: ['projects'] }), false);
});
