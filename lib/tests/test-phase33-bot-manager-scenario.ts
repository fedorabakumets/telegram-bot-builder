/**
 * @fileoverview Фаза 33: генерация независимого сценария управляющего бота.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { generatePythonCode } from '../bot-generator.ts';
import { makeBotManagerScenario } from './fixtures/bot-manager-scenario.ts';

/**
 * Генерирует код из синтетического сценария.
 * @returns Исходный код бота на Python
 */
function generateManagerCode(): string {
  return generatePythonCode(makeBotManagerScenario() as any, {
    botName: 'ManagerPhase33', userDatabaseEnabled: false,
  });
}

/**
 * Проверяет синтаксис сгенерированного кода в отдельной временной папке.
 * @param code - Исходный код Python
 */
function assertPythonSyntax(code: string): void {
  const directory = mkdtempSync(join(tmpdir(), 'botcraft-phase33-'));
  try {
    const file = join(directory, 'main.py');
    writeFileSync(file, code, 'utf8');
    execFileSync('python', ['-m', 'py_compile', file]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('Фаза 33: управляющий бот', () => {
  const code = generateManagerCode();

  it('генерирует команду /start и запрос списка проектов', () => {
    assert.match(code, /CommandStart\(|Command\(['"]start['"]\)/);
    assert.ok(code.includes('/api/bot/projects?telegram_id='));
    assert.ok(code.includes('projects'));
  });

  it('генерирует сообщение с inline-кнопкой проекта', () => {
    assert.ok(code.includes('projects_message'));
    assert.ok(code.includes('Открыть проект'));
    assert.ok(code.includes('project_1'));
  });

  it('создаёт корректный Python-файл', () => {
    assertPythonSyntax(code);
  });
});
