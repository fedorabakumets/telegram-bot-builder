/** @fileoverview Проверки сохранения словарей и ошибок валидации после обновления Zod. */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { sendMessageSchema } from './tables/additional-schemas';
import { nodeSchema } from './tables/node-schema';
import { callbackHandlerInitParamsSchema } from '../../lib/templates/callback-handler-init/callback-handler-init.schema';
import { handleUserInputParamsSchema } from '../../lib/templates/handle-user-input/handle-user-input.schema';

it('сохраняет произвольные данные пользователя и фильтры переменных', () => {
  const message = sendMessageSchema.parse({ userData: { order: 42, nested: { paid: true } } });
  assert.deepEqual(message.userData, { order: 42, nested: { paid: true } });
  const node = nodeSchema.parse({ id: 'node', type: 'message', position: { x: 0, y: 0 }, data: { variableFilters: { status: 'active' } } });
  assert.deepEqual(node.data.variableFilters, { status: 'active' });
});

it('возвращает ошибки при неверном типе значения словаря', () => {
  const result = nodeSchema.safeParse({ id: 'node', type: 'message', position: { x: 0, y: 0 }, data: { variableFilters: { status: 42 } } });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.error.issues.some(issue => issue.path.includes('variableFilters')));
});

it('сохраняет фильтры в параметрах шаблонов обработчиков', () => {
  const variableFilters = { status: 'active' };
  const callback = callbackHandlerInitParamsSchema.parse({ nodeId: 'node', hasHideAfterClick: false, variableFilters });
  const input = handleUserInputParamsSchema.parse({ nodes: [{ id: 'node', safeName: 'node', type: 'message', data: { variableFilters } }] });
  assert.deepEqual(callback.variableFilters, variableFilters);
  assert.deepEqual(input.nodes[0].data.variableFilters, variableFilters);
});
