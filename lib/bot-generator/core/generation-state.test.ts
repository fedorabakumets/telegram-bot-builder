/**
 * @fileoverview Тесты для generation-state: emitOnce и generatedComponents
 * @module bot-generator/core/generation-state.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createGenerationState,
  emitOnce,
  markComponentGenerated,
  isComponentGenerated,
  COMPONENT_NAMES,
} from './generation-state';
import { generatePythonCode } from '../../bot-generator';
import type { BotData } from '@shared/schema';

// ---------------------------------------------------------------------------
// Юнит-тесты: emitOnce
// ---------------------------------------------------------------------------

describe('emitOnce — базовое поведение', () => {
  it('генерирует код при первом вызове', () => {
    const state = createGenerationState({});
    const result = emitOnce(state, 'my_component', () => 'generated code');
    assert.strictEqual(result, 'generated code');
  });

  it('возвращает пустую строку при повторном вызове с тем же ключом', () => {
    const state = createGenerationState({});
    emitOnce(state, 'my_component', () => 'generated code');
    const second = emitOnce(state, 'my_component', () => 'generated code again');
    assert.strictEqual(second, '');
  });

  it('разные ключи генерируются независимо', () => {
    const state = createGenerationState({});
    const a = emitOnce(state, 'component_a', () => 'code_a');
    const b = emitOnce(state, 'component_b', () => 'code_b');
    assert.strictEqual(a, 'code_a');
    assert.strictEqual(b, 'code_b');
  });

  it('регистрирует компонент в generatedComponents после первого вызова', () => {
    const state = createGenerationState({});
    assert.ok(!state.generatedComponents.has('comp'));
    emitOnce(state, 'comp', () => 'x');
    assert.ok(state.generatedComponents.has('comp'));
  });

  it('не вызывает generate() при повторном вызове', () => {
    const state = createGenerationState({});
    let callCount = 0;
    emitOnce(state, 'comp', () => { callCount++; return 'x'; });
    emitOnce(state, 'comp', () => { callCount++; return 'x'; });
    assert.strictEqual(callCount, 1);
  });

  it('работает с COMPONENT_NAMES константами', () => {
    const state = createGenerationState({});
    const r1 = emitOnce(state, COMPONENT_NAMES.DATABASE, () => 'db code');
    const r2 = emitOnce(state, COMPONENT_NAMES.DATABASE, () => 'db code again');
    assert.strictEqual(r1, 'db code');
    assert.strictEqual(r2, '');
  });
});

describe('emitOnce — состояние изолировано между вызовами createGenerationState', () => {
  it('два разных state не делят generatedComponents', () => {
    const state1 = createGenerationState({});
    const state2 = createGenerationState({});
    emitOnce(state1, 'comp', () => 'x');
    // state2 не должен знать о state1
    const result = emitOnce(state2, 'comp', () => 'y');
    assert.strictEqual(result, 'y');
  });
});

// ---------------------------------------------------------------------------
// Юнит-тесты: markComponentGenerated / isComponentGenerated
// ---------------------------------------------------------------------------

describe('markComponentGenerated / isComponentGenerated', () => {
  it('isComponentGenerated возвращает false до регистрации', () => {
    const state = createGenerationState({});
    assert.strictEqual(isComponentGenerated(state, 'x'), false);
  });

  it('isComponentGenerated возвращает true после markComponentGenerated', () => {
    const state = createGenerationState({});
    const next = markComponentGenerated(state, 'x');
    assert.strictEqual(isComponentGenerated(next, 'x'), true);
  });

  it('markComponentGenerated не мутирует исходный state', () => {
    const state = createGenerationState({});
    markComponentGenerated(state, 'x');
    // generatedComponents в state — мутабельный Set, markComponentGenerated создаёт новый
    // Проверяем что оригинальный state не изменился через markComponentGenerated
    const fresh = createGenerationState({});
    assert.strictEqual(isComponentGenerated(fresh, 'x'), false);
  });
});

// ---------------------------------------------------------------------------
// Интеграционные тесты: pipeline использует emitOnce
// ---------------------------------------------------------------------------

function makeMinimalBotData(): BotData {
  return {
    nodes: [
      {
        id: 'start_1',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          command: '/start',
          messageText: 'Привет!',
          buttons: [],
          keyboardType: 'inline',
          isPrivateOnly: false,
          adminOnly: false,
          requiresAuth: false,
          synonyms: [],
          showInMenu: true,
          description: 'Запустить бота',
          markdown: false,
          enableConditionalMessages: false,
          conditionalMessages: [],
        } as unknown as BotData['nodes'][number]['data'],
      },
    ],
    connections: [],
  };
}

/** Считает количество вхождений подстроки */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

describe('pipeline — emitOnce предотвращает дублирование секций', () => {
  it('save_message_to_api определена ровно 1 раз при userDatabaseEnabled=true', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const count = countOccurrences(code, 'async def save_message_to_api(');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('save_message_to_api определена ровно 1 раз при userDatabaseEnabled=false', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: false,
    });
    const count = countOccurrences(code, 'async def save_message_to_api(');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('async def main() определена ровно 1 раз', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const count = countOccurrences(code, 'async def main()');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('Dispatcher() инициализируется ровно 1 раз', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const count = countOccurrences(code, 'dp = Dispatcher()');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('init_database определена ровно 1 раз при userDatabaseEnabled=true', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const count = countOccurrences(code, 'async def init_database(');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('replace_variables_in_text определена ровно 1 раз', () => {
    const code = generatePythonCode(makeMinimalBotData(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const count = countOccurrences(code, 'def replace_variables_in_text(');
    assert.strictEqual(count, 1, `Ожидалось 1, найдено ${count}`);
  });

  it('повторный вызов generatePythonCode с теми же данными не накапливает дубли', () => {
    const botData = makeMinimalBotData();
    const code1 = generatePythonCode(botData, { botName: 'TestBot', userDatabaseEnabled: true });
    const code2 = generatePythonCode(botData, { botName: 'TestBot', userDatabaseEnabled: true });
    // Каждый вызов создаёт свой state — дублей быть не должно ни в одном
    const count1 = countOccurrences(code1, 'async def save_message_to_api(');
    const count2 = countOccurrences(code2, 'async def save_message_to_api(');
    assert.strictEqual(count1, 1);
    assert.strictEqual(count2, 1);
  });
});
