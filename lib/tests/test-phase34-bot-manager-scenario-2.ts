/**
 * @fileoverview Фаза 34: переход от списка проектов к карточке проекта.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generatePythonCode } from '../bot-generator.ts';
import { makeBotManagerScenario } from './fixtures/bot-manager-scenario.ts';

describe('Фаза 34: карточка проекта', () => {
  const code = generatePythonCode(makeBotManagerScenario() as any, {
    botName: 'ManagerPhase34', userDatabaseEnabled: false,
  });

  it('создаёт обработчик входящего callback', () => {
    assert.ok(code.includes('manager_callback'));
    assert.ok(code.includes('fetch_project_detail'));
  });

  it('получает карточку проекта по callback_data', () => {
    assert.ok(code.includes('/api/bot/projects/'));
    assert.ok(code.includes('callback_data'));
    assert.ok(code.includes('project_detail'));
  });

  it('подставляет название проекта в карточку', () => {
    assert.ok(code.includes('detail_message'));
    assert.ok(code.includes('project_detail.name'));
  });
});
