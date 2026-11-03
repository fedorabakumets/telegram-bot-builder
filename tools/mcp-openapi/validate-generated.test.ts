/** @fileoverview Проверки отказа старому generated-клиенту до исполнения его кода. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedClient } from './validate-generated';
/** Проверенный клиент с пятью независимыми определениями маршрутов. */
const reviewed = ['/api/health', '/api/bots', '/api/projects', '/api/projects/{id}', '/api/projects/{id}/bot/statuses'];
/**
 * Строит исходник фикстуры без сетевого клиента и выполнения generated.
 * @param routes - Пути фикстуры.
 * @returns Исходный текст определений.
 */
function fixture(routes: string[]): string {
  return `const tools = ${JSON.stringify(routes.map(path => ({ pathTemplate: path, method: 'get', tags: [path === '/api/health' ? 'health' : path === '/api/bots' ? 'bots' : 'projects'] })))};`;
}
test('Разрешённый фиксированный клиент принят', () => assert.equal(validateGeneratedClient(fixture(reviewed)), 5));
test('Старые, динамические и неполные определения отклоняются до исполнения', () => {
  assert.throws(() => validateGeneratedClient(fixture([...reviewed, '/api/agent-tokens'])), /не соответствует/);
  assert.throws(() => validateGeneratedClient(fixture(reviewed.slice(0, 4))), /ровно пять/);
  assert.throws(() => validateGeneratedClient('const tool = {pathTemplate: compute(), method:"get", tags:["projects"]};'), /не соответствует/);
});
