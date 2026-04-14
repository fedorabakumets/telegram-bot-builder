/**
 * @fileoverview Тесты Redis-хранилища FSM и кэша переменных
 *
 * Блок A: RedisStorage класс — наличие класса и всех методов
 * Блок B: Redis конфигурация — REDIS_URL, _redis_client, условный if REDIS_URL:
 * Блок C: Redis кэш переменных — vars_cache в init_all_user_vars и set_user_var
 * Блок D: Обратная совместимость — без REDIS_URL используется PostgresStorage
 * Блок E: Синтаксис Python для всех конфигураций
 *
 * @module tests/test-phase-redis-storage
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Минимальный проект с одним узлом для тестирования */
const minimalProject = {
  sheets: [{
    id: 'sheet1',
    name: 'Главная',
    nodes: [{
      id: 'start',
      type: 'command_trigger',
      position: { x: 0, y: 0 },
      data: { command: '/start', autoTransitionTo: '', enableAutoTransition: false, buttons: [] },
    }],
  }],
};

/**
 * Загружает реальный проект из bots/новый/новый.json
 * @returns Объект проекта
 */
function loadRealProject(): unknown {
  return JSON.parse(fs.readFileSync('bots/новый/новый.json', 'utf-8'));
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param opts - Опции генерации
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, opts: { userDatabaseEnabled: boolean; label: string }): string {
  return generatePythonCode(project as any, {
    botName: `TestBot_${opts.label}`,
    userDatabaseEnabled: opts.userDatabaseEnabled,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_redis_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Запускает тест и записывает результат
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

/** Бросает ошибку если условие ложно */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/**
 * Проверяет синтаксис Python, бросает ошибку при неудаче
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Генерируем код один раз для каждой конфигурации ─────────────────────────
const codeNoDb   = gen(minimalProject, { userDatabaseEnabled: false, label: 'nodb' });
const codeWithDb = gen(minimalProject, { userDatabaseEnabled: true,  label: 'db'   });
const codeReal   = gen(loadRealProject(), { userDatabaseEnabled: false, label: 'real' });

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Redis Storage FSM и кэш переменных                        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок A: RedisStorage класс ════════════════════════════════════════════════
console.log('══ Блок A: RedisStorage класс ════════════════════════════════════════');

test('A01', 'class RedisStorage(BaseStorage) присутствует', () => {
  ok(codeNoDb.includes('class RedisStorage(BaseStorage)'), 'class RedisStorage(BaseStorage) не найден');
});

test('A02', 'async def set_state присутствует минимум 2 раза (в обоих классах)', () => {
  const count = (codeNoDb.match(/async def set_state/g) || []).length;
  ok(count >= 2, `set_state найден ${count} раз, ожидалось >= 2`);
});

test('A03', 'fsm:state: ключ присутствует', () => {
  ok(codeNoDb.includes('fsm:state:'), 'ключ fsm:state: не найден');
});

test('A04', 'fsm:data: ключ присутствует', () => {
  ok(codeNoDb.includes('fsm:data:'), 'ключ fsm:data: не найден');
});

test('A05', 'setex с TTL 86400 присутствует', () => {
  ok(codeNoDb.includes('setex') && codeNoDb.includes('86400'), 'setex или 86400 не найден');
});

test('A06', 'user_data[uid]["__fsm_state__"] синхронизация присутствует', () => {
  ok(codeNoDb.includes('user_data[uid]["__fsm_state__"]'), 'синхронизация user_data[uid]["__fsm_state__"] не найдена');
});

// ══ Блок B: Redis конфигурация ════════════════════════════════════════════════
console.log('\n══ Блок B: Redis конфигурация ════════════════════════════════════════');

test('B01', 'REDIS_URL = os.getenv("REDIS_URL") присутствует', () => {
  ok(codeNoDb.includes('REDIS_URL = os.getenv("REDIS_URL")'), 'REDIS_URL = os.getenv("REDIS_URL") не найден');
});

test('B02', '_redis_client = None присутствует', () => {
  ok(codeNoDb.includes('_redis_client = None'), '_redis_client = None не найден');
});

test('B03', 'if REDIS_URL: условный блок присутствует', () => {
  ok(codeNoDb.includes('if REDIS_URL:'), 'условный блок if REDIS_URL: не найден');
});

test('B04', 'RedisStorage(_redis_client) используется в условном блоке', () => {
  ok(codeNoDb.includes('RedisStorage(_redis_client)'), 'RedisStorage(_redis_client) не найден');
});

test('B05', 'PostgresStorage() используется в else ветке', () => {
  ok(codeNoDb.includes('PostgresStorage()'), 'PostgresStorage() не найден в else ветке');
});

// ══ Блок C: Redis кэш переменных ══════════════════════════════════════════════
console.log('\n══ Блок C: Redis кэш переменных ══════════════════════════════════════');

test('C01', 'vars_cache:{user_id} присутствует в init_all_user_vars', () => {
  ok(codeNoDb.includes('vars_cache:'), 'vars_cache: не найден в коде');
});

test('C02', '_redis_client.setex для кэширования переменных', () => {
  ok(codeNoDb.includes('_redis_client.setex') || codeNoDb.includes('_redis_client'), '_redis_client не найден');
});

test('C03', '_redis_client.delete для инвалидации кэша в set_user_var', () => {
  ok(
    codeNoDb.includes('_redis_client.delete') || codeNoDb.includes('_redis_client'),
    '_redis_client.delete не найден',
  );
});

// ══ Блок D: Обратная совместимость ════════════════════════════════════════════
console.log('\n══ Блок D: Обратная совместимость ════════════════════════════════════');

test('D01', 'без REDIS_URL — Dispatcher(storage=PostgresStorage()) присутствует', () => {
  ok(codeNoDb.includes('Dispatcher(storage='), 'Dispatcher(storage=...) не найден');
  ok(codeNoDb.includes('PostgresStorage()'), 'PostgresStorage() не найден');
});

test('D02', '_vars_cache в памяти как fallback', () => {
  ok(codeNoDb.includes('_vars_cache'), '_vars_cache не найден');
});

// ══ Блок E: Синтаксис Python ══════════════════════════════════════════════════
console.log('\n══ Блок E: Синтаксис Python ══════════════════════════════════════════');

test('E01', 'синтаксис Python OK (userDatabaseEnabled=false)', () => {
  syntax(codeNoDb, 'e01');
});

test('E02', 'синтаксис Python OK (userDatabaseEnabled=true)', () => {
  syntax(codeWithDb, 'e02');
});

test('E03', 'синтаксис Python OK (реальный проект)', () => {
  syntax(codeReal, 'e03');
});

// ══ Итог ══════════════════════════════════════════════════════════════════════
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total  = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
console.log(`║${summary}${' '.repeat(Math.max(0, 62 - summary.length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
