/**
 * @fileoverview Фаза 66 — Переключатель базы данных (USER_DATABASE / db_pool)
 *
 * Регрессия на баг: при выключенной БД (`userDatabaseEnabled: false`) переменная
 * `db_pool` не объявлялась на уровне модуля, но код контента и `main()`
 * обращались к ней (`if db_pool:`, `global db_pool`) → `NameError: name 'db_pool'
 * is not defined` и падение бота при старте.
 *
 * Фикс: `db_pool = None` объявляется в config.py.jinja2 ВСЕГДА, независимо от
 * `userDatabaseEnabled`. Сам блок настроек БД (`DATABASE_URL`) остаётся только
 * при включённой БД.
 *
 * Блоки:
 *  A. db_pool = None присутствует всегда (вкл/выкл БД, с projectId и без)
 *  B. Регрессия — если код использует db_pool, он обязан его объявлять
 *  C. DATABASE_URL только при включённой БД
 *  D. Синтаксис Python OK при выключенной БД
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Вспомогательные узлы ────────────────────────────────────────────────────

/**
 * Создаёт узел типа message
 * @param id - Идентификатор узла
 * @param text - Текст сообщения
 */
function makeMessageNode(id: string, text = 'Новое сообщение') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 300 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/**
 * Создаёт узел типа command_trigger
 * @param id - Идентификатор узла
 * @param command - Команда бота
 * @param targetId - ID целевого узла
 */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 100, y: 300 },
    data: {
      command,
      description: 'Запустить бота',
      sourceNodeId: targetId,
      autoTransitionTo: targetId,
    },
  };
}

// ─── Утилиты генерации ───────────────────────────────────────────────────────

/**
 * Создаёт минимальный project.json с заданными узлами
 * @param nodes - Массив узлов
 */
function makeCleanProject(nodes: any[]) {
  return {
    version: 2,
    activeSheetId: 'sheet-db',
    sheets: [{
      id: 'sheet-db',
      name: 'Лист 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/** Простой проект «/start → одно сообщение» (эталонный кейс из бага) */
function startProject() {
  return makeCleanProject([
    makeMessageNode('start-message'),
    makeCommandTriggerNode('start-command-trigger', '/start', 'start-message'),
  ]);
}

/**
 * Генерирует Python-код с заданными опциями БД/проекта
 * @param label - Метка для имени бота
 * @param userDatabaseEnabled - Включить БД
 * @param projectId - ID проекта (включает генерацию кода контента)
 */
function gen(label: string, userDatabaseEnabled: boolean, projectId: number | null = null): string {
  return generatePythonCode(startProject(), {
    botName: `DbToggle_${label}`,
    enableComments: false,
    userDatabaseEnabled,
    projectId,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_db_${label}.py`;
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

/**
 * Проверяет синтаксис Python и бросает ошибку при неудаче
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка Python:\n${r.error}`);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 66 — Переключатель базы данных (db_pool)             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: db_pool = None присутствует всегда
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: db_pool = None присутствует всегда ──────────────────');

test('A01', 'db_pool = None присутствует при выключенной БД', () => {
  ok(gen('A01', false).includes('db_pool = None'),
    'db_pool = None отсутствует при userDatabaseEnabled: false');
});

test('A02', 'db_pool = None присутствует при включённой БД', () => {
  ok(gen('A02', true).includes('db_pool = None'),
    'db_pool = None отсутствует при userDatabaseEnabled: true');
});

test('A03', 'db_pool = None присутствует при выключенной БД + projectId', () => {
  ok(gen('A03', false, 263).includes('db_pool = None'),
    'db_pool = None отсутствует при DB=false и заданном projectId (кейс бага)');
});

test('A04', 'db_pool = None присутствует при включённой БД + projectId', () => {
  ok(gen('A04', true, 263).includes('db_pool = None'),
    'db_pool = None отсутствует при DB=true и заданном projectId');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: Регрессия — использование db_pool требует объявления
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: использование db_pool требует объявления ────────────');

test('B01', 'main() объявляет global db_pool и переменная определена', () => {
  const code = gen('B01', false, 263);
  ok(code.includes('global db_pool'), 'global db_pool отсутствует в main()');
  ok(code.includes('db_pool = None'), 'db_pool не объявлен на уровне модуля');
});

test('B02', 'если есть "if db_pool:", то есть и объявление db_pool = None', () => {
  const code = gen('B02', false, 263);
  if (code.includes('if db_pool:')) {
    ok(code.includes('db_pool = None'),
      'Код использует "if db_pool:", но db_pool = None не объявлен → NameError');
  }
});

test('B03', 'объявление db_pool идёт раньше первого использования', () => {
  const code = gen('B03', false, 263);
  const declIdx = code.indexOf('db_pool = None');
  const mainIdx = code.indexOf('async def main()');
  ok(declIdx !== -1, 'db_pool = None не найдено');
  ok(mainIdx === -1 || declIdx < mainIdx,
    'db_pool = None объявлен позже main() — переменная не определена в момент использования');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: DATABASE_URL только при включённой БД
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: DATABASE_URL только при включённой БД ───────────────');

test('C01', 'DATABASE_URL присутствует при включённой БД', () => {
  ok(gen('C01', true).includes('DATABASE_URL = os.getenv("DATABASE_URL")'),
    'DATABASE_URL отсутствует при userDatabaseEnabled: true');
});

test('C02', 'DATABASE_URL отсутствует при выключенной БД', () => {
  ok(!gen('C02', false).includes('DATABASE_URL = os.getenv("DATABASE_URL")'),
    'DATABASE_URL присутствует при userDatabaseEnabled: false — лишний код');
});

test('C03', 'init_database присутствует только при включённой БД', () => {
  ok(gen('C03', true).includes('async def init_database'),
    'init_database отсутствует при DB=true');
  ok(!gen('C03b', false).includes('async def init_database'),
    'init_database присутствует при DB=false — лишний код');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Синтаксис Python OK при выключенной БД
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Синтаксис Python ────────────────────────────────────');

test('D01', 'Синтаксис Python OK при выключенной БД', () => {
  syntax(gen('D01', false), 'D01');
});

test('D02', 'Синтаксис Python OK при выключенной БД + projectId', () => {
  syntax(gen('D02', false, 263), 'D02');
});

test('D03', 'Синтаксис Python OK при включённой БД + projectId', () => {
  syntax(gen('D03', true, 263), 'D03');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК E: middleware определены при выключенной БД (регрессия NameError)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: middleware при выключенной БД ───────────────────────');

test('E01', 'stale_update_filter_middleware определён при выключенной БД', () => {
  const code = gen('E01', false);
  ok(code.includes('async def stale_update_filter_middleware'),
    'stale_update_filter_middleware не определён при DB=false → NameError при старте');
});

test('E02', 'main() регистрирует stale_update_filter_middleware при выключенной БД', () => {
  const code = gen('E02', false);
  ok(code.includes('dp.message.middleware(stale_update_filter_middleware)'),
    'main() не регистрирует stale_update_filter_middleware');
});

test('E03', 'регистрация stale-фильтра идёт после его определения', () => {
  const code = gen('E03', false, 263);
  const defIdx = code.indexOf('async def stale_update_filter_middleware');
  const useIdx = code.indexOf('dp.message.middleware(stale_update_filter_middleware)');
  ok(defIdx !== -1, 'определение stale_update_filter_middleware не найдено');
  ok(useIdx !== -1, 'регистрация stale_update_filter_middleware не найдена');
  ok(defIdx < useIdx,
    'stale_update_filter_middleware регистрируется раньше определения → NameError');
});

test('E04', 'message_logging_middleware отсутствует при выключенной БД', () => {
  const code = gen('E04', false);
  ok(!code.includes('async def message_logging_middleware'),
    'message_logging_middleware присутствует при DB=false — лишний код');
});

test('E05', 'message_logging_middleware присутствует при включённой БД', () => {
  const code = gen('E05', true);
  ok(code.includes('async def message_logging_middleware'),
    'message_logging_middleware отсутствует при DB=true');
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
