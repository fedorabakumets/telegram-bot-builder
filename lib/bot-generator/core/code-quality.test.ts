/**
 * @fileoverview Тесты качества сгенерированного кода
 *
 * Проверяет отсутствие антипаттернов в сгенерированном Python-коде:
 * - globals() проверки
 * - дублирование @@NODE_START/END маркеров
 * - лишние импорты datetime для простых ботов
 *
 * @module bot-generator/core/code-quality.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePythonCode } from '../../bot-generator';
import type { BotData } from '@shared/schema';

// ---------------------------------------------------------------------------
// Фикстуры
// ---------------------------------------------------------------------------

function makeSimpleBot(): BotData {
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
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 0, y: 300 },
        data: {
          messageText: 'Простое сообщение',
          buttons: [],
          keyboardType: 'inline',
          isPrivateOnly: false,
          adminOnly: false,
          requiresAuth: false,
          synonyms: [],
          markdown: false,
          enableConditionalMessages: false,
          conditionalMessages: [],
          enableAutoTransition: false,
        } as unknown as BotData['nodes'][number]['data'],
      },
    ],
    connections: [],
  };
}

function makeBotWithSynonyms(): BotData {
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
          synonyms: ['старт', 'начало'],
          showInMenu: true,
          description: 'Запустить бота',
          markdown: false,
          enableConditionalMessages: false,
          conditionalMessages: [],
        } as unknown as BotData['nodes'][number]['data'],
      },
      {
        id: 'msg_1',
        type: 'message',
        position: { x: 0, y: 300 },
        data: {
          messageText: 'Сообщение',
          buttons: [],
          keyboardType: 'inline',
          isPrivateOnly: false,
          adminOnly: false,
          requiresAuth: false,
          synonyms: ['новое'],
          markdown: false,
          enableConditionalMessages: false,
          conditionalMessages: [],
          enableAutoTransition: false,
        } as unknown as BotData['nodes'][number]['data'],
      },
    ],
    connections: [],
  };
}

function makeBotWithMuteUser(): BotData {
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
          keyboardType: 'none',
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
      {
        id: 'mute_1',
        type: 'mute_user',
        position: { x: 0, y: 300 },
        data: {
          duration: 3600,
          reason: 'Нарушение',
          synonyms: [],
        } as unknown as BotData['nodes'][number]['data'],
      },
    ],
    connections: [],
  };
}

/** Считает вхождения подстроки */
function count(haystack: string, needle: string): number {
  let n = 0, pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) { n++; pos += needle.length; }
  return n;
}

// ---------------------------------------------------------------------------
// globals() антипаттерн
// ---------------------------------------------------------------------------

describe('code-quality — отсутствие globals() антипаттерна', () => {
  it('не должно быть globals() в простом боте', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    assert.ok(
      !code.includes('in globals()'),
      'Код не должен содержать проверки "in globals()"'
    );
  });

  it('не должно быть globals() в боте с синонимами', () => {
    const code = generatePythonCode(makeBotWithSynonyms(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    assert.ok(
      !code.includes('in globals()'),
      'Синонимы не должны использовать "in globals()"'
    );
  });

  it('не должно быть globals() при userDatabaseEnabled=false', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: false,
    });
    assert.ok(!code.includes('in globals()'));
  });
});

// ---------------------------------------------------------------------------
// @@NODE_START/END маркеры — не должны дублироваться
// ---------------------------------------------------------------------------

describe('code-quality — @@NODE_START/END маркеры не дублируются', () => {
  it('каждый NODE_START встречается ровно один раз', () => {
    const code = generatePythonCode(makeBotWithSynonyms(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });

    // Извлекаем все nodeId из маркеров
    const startMatches = [...code.matchAll(/# @@NODE_START:([^@]+)@@/g)];
    const nodeIds = startMatches.map(m => m[1]);

    for (const nodeId of nodeIds) {
      const startCount = count(code, `# @@NODE_START:${nodeId}@@`);
      assert.strictEqual(
        startCount, 1,
        `@@NODE_START:${nodeId}@@ встречается ${startCount} раз, ожидалось 1`
      );
    }
  });

  it('каждый NODE_END встречается ровно один раз', () => {
    const code = generatePythonCode(makeBotWithSynonyms(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });

    const endMatches = [...code.matchAll(/# @@NODE_END:([^@]+)@@/g)];
    const nodeIds = endMatches.map(m => m[1]);

    for (const nodeId of nodeIds) {
      const endCount = count(code, `# @@NODE_END:${nodeId}@@`);
      assert.strictEqual(
        endCount, 1,
        `@@NODE_END:${nodeId}@@ встречается ${endCount} раз, ожидалось 1`
      );
    }
  });

  it('количество NODE_START равно количеству NODE_END', () => {
    const code = generatePythonCode(makeBotWithSynonyms(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    const starts = count(code, '@@NODE_START:');
    const ends = count(code, '@@NODE_END:');
    assert.strictEqual(starts, ends, `NODE_START (${starts}) != NODE_END (${ends})`);
  });

  it('маркеры сбалансированы для простого бота', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: false,
    });
    const starts = count(code, '@@NODE_START:');
    const ends = count(code, '@@NODE_END:');
    assert.strictEqual(starts, ends);
  });
});

// ---------------------------------------------------------------------------
// hasDatetimeNodesResult — datetime не импортируется без нужды
// ---------------------------------------------------------------------------

describe('code-quality — datetime импортируется только когда нужен', () => {
  it('простой бот без mute/ban НЕ импортирует datetime', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: false,
    });
    assert.ok(
      !code.includes('from datetime import datetime'),
      'Простой бот без mute/ban не должен импортировать datetime'
    );
  });

  it('бот с mute_user ИМПОРТИРУЕТ datetime', () => {
    const code = generatePythonCode(makeBotWithMuteUser(), {
      botName: 'TestBot',
      userDatabaseEnabled: false,
    });
    assert.ok(
      code.includes('from datetime import datetime'),
      'Бот с mute_user должен импортировать datetime'
    );
  });

  it('бот с userDatabaseEnabled=true импортирует datetime (нужен для get_moscow_time)', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });
    assert.ok(
      code.includes('from datetime import datetime'),
      'userDatabaseEnabled=true требует datetime для get_moscow_time'
    );
  });
});

// ---------------------------------------------------------------------------
// alias-nodes — прямой вызов без globals()
// ---------------------------------------------------------------------------

describe('code-quality — alias-nodes вызывают handler напрямую', () => {
  it('handle_command_start вызывает start_handler напрямую', () => {
    const code = generatePythonCode(makeSimpleBot(), {
      botName: 'TestBot',
      userDatabaseEnabled: true,
    });

    if (code.includes('async def handle_command_start(')) {
      // Должен содержать прямой вызов
      assert.ok(
        code.includes('await start_handler(message)'),
        'handle_command_start должен вызывать start_handler напрямую'
      );
      // Не должен содержать globals() проверку
      assert.ok(
        !code.includes('"start_handler" in globals()'),
        'handle_command_start не должен использовать globals()'
      );
    }
  });
});
