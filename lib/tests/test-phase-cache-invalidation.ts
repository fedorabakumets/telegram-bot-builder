/**
 * @fileoverview Фаза — Инвалидация Redis кэша при HTTP запросах
 *
 * Тестирует корректность инвалидации кэша и очистки переменных:
 *  A. Очистка переменных перед HTTP запросом (4 теста)
 *  B. Синхронная инвалидация Redis кэша (2 теста)
 *  C. Интеграция — два последовательных HTTP запроса (2 теста)
 *
 * Баг: при переходе между проектами переменная `project_tokens`
 * показывала данные от предыдущего проекта из-за устаревшего Redis кэша.
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа http_request
 * @param id - Идентификатор узла
 * @param data - Дополнительные данные узла
 */
function makeHttpRequestNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'http_request',
    position: { x: 400, y: 0 },
    data: {
      httpRequestUrl: 'https://api.example.com/data',
      httpRequestMethod: 'GET',
      httpRequestTimeout: 30,
      httpRequestResponseVariable: 'response',
      httpRequestStatusVariable: '',
      httpRequestHeaders: '',
      httpRequestBody: '',
      autoTransitionTo: '',
      ...data,
    },
  };
}

/**
 * Создаёт узел типа start
 * @param id - Идентификатор узла
 */
function makeStartNode(id = 'start1') {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] },
  };
}

// ─── Утилиты генерации ───────────────────────────────────────────────────────

/**
 * Создаёт минимальный project.json с заданными узлами
 * @param nodes - Массив узлов
 * @param userDatabaseEnabled - Включить БД
 */
function makeProject(nodes: any[], userDatabaseEnabled = false) {
  return {
    version: 2,
    activeSheetId: 'sheet-ci',
    userDatabaseEnabled,
    sheets: [{
      id: 'sheet-ci',
      name: 'Основной поток',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: any, label: string): string {
  return generatePythonCode(project, {
    botName: `CacheInv_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_ci_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    const err = e.stderr?.toString() ?? String(e);
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: err };
  }
}

// ─── Тест-раннер ─────────────────────────────────────────────────────────────

/** Результат одного теста */
type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Запускает один тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

/**
 * Утверждение — бросает ошибку если условие ложно
 * @param cond - Условие
 * @param msg - Сообщение об ошибке
 */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ЗАГОЛОВОК
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║       Фаза — Инвалидация Redis кэша при HTTP запросах       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: Очистка переменных перед HTTP запросом
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Очистка переменных перед HTTP запросом ───────────────');

test('A01', 'Код содержит pop("response_var", None) перед сохранением ответа', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'response_var',
  })]);
  const code = gen(p, 'A01');
  ok(
    code.includes('user_data[user_id].pop("response_var", None)'),
    'user_data[user_id].pop("response_var", None) не найдено — очистка responseVariable отсутствует',
  );
});

test('A02', 'Код содержит pop("status_var", None) когда задан statusVariable', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'response_var',
    httpRequestStatusVariable: 'status_var',
  })]);
  const code = gen(p, 'A02');
  ok(
    code.includes('user_data[user_id].pop("status_var", None)'),
    'user_data[user_id].pop("status_var", None) не найдено — очистка statusVariable отсутствует',
  );
});

test('A03', 'Без statusVariable — очистка только responseVariable, нет pop("", None)', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'response',
    httpRequestStatusVariable: '',
  })]);
  const code = gen(p, 'A03');
  ok(
    code.includes('pop("response"'),
    'pop("response" не найдено — очистка responseVariable отсутствует',
  );
  ok(
    !code.includes('pop("", None)'),
    'pop("", None) найдено — очистка пустой переменной не должна генерироваться',
  );
});

test('A04', 'pop происходит ДО set_user_var (очистка перед сохранением)', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1', {
    httpRequestResponseVariable: 'tokens',
  })]);
  const code = gen(p, 'A04');
  const fnIdx = code.indexOf('async def handle_callback_http1(');
  ok(fnIdx !== -1, 'handle_callback_http1 не найден');
  const fnBody = code.slice(fnIdx);
  const popIdx = fnBody.indexOf('.pop("tokens"');
  const setIdx = fnBody.indexOf('set_user_var(user_id, "tokens"');
  ok(popIdx !== -1, '.pop("tokens" не найдено в теле обработчика');
  ok(setIdx !== -1, 'set_user_var(user_id, "tokens" не найдено в теле обработчика');
  ok(popIdx < setIdx, `pop (позиция ${popIdx}) должен быть ДО set_user_var (позиция ${setIdx})`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: Синхронная инвалидация Redis кэша
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: Синхронная инвалидация Redis кэша ────────────────────');

test('B01', 'set_user_var содержит await _redis_client.delete (синхронный вызов)', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'B01');
  ok(
    code.includes('await _redis_client.delete(f"vars_cache:{user_id}")'),
    'await _redis_client.delete(f"vars_cache:{user_id}") не найдено — синхронная инвалидация Redis отсутствует',
  );
});

test('B02', 'set_user_var НЕ содержит create_task(_redis_client.delete', () => {
  const p = makeProject([makeStartNode(), makeHttpRequestNode('http1')]);
  const code = gen(p, 'B02');
  ok(
    !code.includes('create_task(_redis_client.delete'),
    'create_task(_redis_client.delete найдено — инвалидация Redis должна быть синхронной (await), не fire-and-forget',
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: Интеграция — два последовательных HTTP запроса
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Интеграция — два последовательных HTTP запроса ──────');

test('C01', 'Два http_request узла — каждый очищает свои переменные', () => {
  const p = makeProject([
    makeStartNode(),
    makeHttpRequestNode('http1', {
      httpRequestResponseVariable: 'tokens',
      autoTransitionTo: 'http2',
    }),
    makeHttpRequestNode('http2', {
      httpRequestResponseVariable: 'detail',
    }),
  ]);
  const code = gen(p, 'C01');
  ok(
    code.includes('pop("tokens"'),
    'pop("tokens" не найдено — очистка переменной первого узла отсутствует',
  );
  ok(
    code.includes('pop("detail"'),
    'pop("detail" не найдено — очистка переменной второго узла отсутствует',
  );
});

test('C02', 'Синтаксис Python валиден для двух последовательных HTTP запросов', () => {
  const p = makeProject([
    makeStartNode(),
    makeHttpRequestNode('http1', {
      httpRequestResponseVariable: 'tokens',
      autoTransitionTo: 'http2',
    }),
    makeHttpRequestNode('http2', {
      httpRequestResponseVariable: 'detail',
    }),
  ]);
  const code = gen(p, 'C02');
  const r = checkSyntax(code, 'C02');
  ok(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
});

// ─── Итог ────────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
const padding = ' '.repeat(Math.max(0, 62 - summary.length));
console.log(`║${summary}${padding}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
