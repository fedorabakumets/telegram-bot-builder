/**
 * @fileoverview Фаза 69 — Переключатель «Живое обновление контента» (contentCache)
 *
 * Контент-код делится на ДВЕ части:
 *   1. `_content_cache` (dict) + `get_content(key, fallback)` — аксессор,
 *      вызывается из текста каждой ноды. ГЕНЕРИРУЕТСЯ ВСЕГДА (при projectId),
 *      иначе NameError в рантайме.
 *   2. Машинерия live-reload: `load_content`, `reload_content`,
 *      `_content_reload_loop`, `_content_subscribe_redis` + их вызовы в main().
 *      ВОТ ЭТО гейтится флагом contentCache.
 *
 * Формула генерации (простой проброс флага, без автодетекта):
 *   generateContent = (contentCache !== false)
 *
 * Блоки:
 *  A. contentCache не задан/true + projectId → есть машинерия И есть аксессор
 *  B. contentCache=false + projectId → НЕТ машинерии, НО аксессор ВСЁ РАВНО есть
 *  C. contentCache=false → в main НЕТ вызовов load_content/_content_reload_loop
 *  D. Синтаксис Python OK для обоих вариантов
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
    activeSheetId: 'sheet-cc',
    sheets: [{
      id: 'sheet-cc',
      name: 'Лист 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { zoom: 1, position: { x: 0, y: 0 } },
      nodes,
    }],
  };
}

/** Простой проект «/start → одно сообщение» */
function startProject() {
  return makeCleanProject([
    makeMessageNode('start-message'),
    makeCommandTriggerNode('start-command-trigger', '/start', 'start-message'),
  ]);
}

/**
 * Генерирует Python-код с заданным значением contentCache.
 * ВСЕГДА передаёт projectId — без него контент-кода нет в принципе.
 * @param label - Метка для имени бота
 * @param contentCache - Значение опции (undefined → дефолт true)
 * @param projectId - ID проекта (по умолчанию 263)
 */
function gen(label: string, contentCache?: boolean, projectId = 263): string {
  const options: any = {
    botName: `ContentCache_${label}`,
    enableComments: false,
    userDatabaseEnabled: false,
    projectId,
  };
  if (contentCache !== undefined) options.contentCache = contentCache;
  return generatePythonCode(startProject(), options);
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_cc_${label}.py`;
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
console.log('║   Фаза 69 — Переключатель «Живое обновление контента»      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: contentCache не задан/true + projectId → есть машинерия И аксессор
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: live-reload включён по умолчанию ────────────────────');

test('A01', 'contentCache не задан → есть async def load_content', () => {
  const code = gen('A01');
  ok(code.includes('async def load_content'),
    'load_content должен присутствовать при дефолтном флаге');
});

test('A02', 'contentCache не задан → есть _content_reload_loop', () => {
  const code = gen('A02');
  ok(code.includes('async def _content_reload_loop'),
    '_content_reload_loop должен присутствовать при дефолтном флаге');
});

test('A03', 'contentCache не задан → есть _content_subscribe_redis', () => {
  const code = gen('A03');
  ok(code.includes('async def _content_subscribe_redis'),
    '_content_subscribe_redis должен присутствовать при дефолтном флаге');
});

test('A04', 'contentCache не задан → есть аксессор get_content и _content_cache', () => {
  const code = gen('A04');
  ok(code.includes('def get_content'), 'get_content должен присутствовать');
  ok(code.includes('_content_cache'), '_content_cache должен присутствовать');
});

test('A05', 'contentCache=true → есть load_content и reload_content', () => {
  const code = gen('A05', true);
  ok(code.includes('async def load_content'), 'load_content должен быть');
  ok(code.includes('async def reload_content'), 'reload_content должен быть');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: contentCache=false + projectId → НЕТ машинерии, НО аксессор есть
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: live-reload выключен, аксессор сохраняется ──────────');

test('B01', 'contentCache=false → НЕТ load_content', () => {
  const code = gen('B01', false);
  ok(!code.includes('async def load_content'),
    'load_content НЕ должен присутствовать при contentCache=false');
});

test('B02', 'contentCache=false → НЕТ reload_content', () => {
  const code = gen('B02', false);
  ok(!code.includes('async def reload_content'),
    'reload_content НЕ должен присутствовать при contentCache=false');
});

test('B03', 'contentCache=false → НЕТ _content_reload_loop', () => {
  const code = gen('B03', false);
  ok(!code.includes('async def _content_reload_loop'),
    '_content_reload_loop НЕ должен присутствовать при contentCache=false');
});

test('B04', 'contentCache=false → НЕТ _content_subscribe_redis', () => {
  const code = gen('B04', false);
  ok(!code.includes('async def _content_subscribe_redis'),
    '_content_subscribe_redis НЕ должен присутствовать при contentCache=false');
});

test('B05', 'contentCache=false → аксессор get_content ВСЁ РАВНО есть', () => {
  const code = gen('B05', false);
  ok(code.includes('def get_content'),
    'get_content должен присутствовать всегда (часть 1 не гейтится)');
});

test('B06', 'contentCache=false → _content_cache ВСЁ РАВНО есть', () => {
  const code = gen('B06', false);
  ok(code.includes('_content_cache'),
    '_content_cache должен присутствовать всегда (часть 1 не гейтится)');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: contentCache=false → в main НЕТ вызовов машинерии
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: вызовы в main() отсутствуют ─────────────────────────');

test('C01', 'contentCache=false → в main НЕТ await load_content(db_pool)', () => {
  const code = gen('C01', false);
  ok(!code.includes('await load_content(db_pool)'),
    'await load_content(db_pool) НЕ должен присутствовать при contentCache=false');
});

test('C02', 'contentCache=false → в main НЕТ _content_reload_loop(db_pool)', () => {
  const code = gen('C02', false);
  ok(!code.includes('_content_reload_loop(db_pool)'),
    '_content_reload_loop(db_pool) НЕ должен присутствовать при contentCache=false');
});

test('C03', 'contentCache=true → в main ЕСТЬ await load_content(db_pool)', () => {
  const code = gen('C03', true);
  ok(code.includes('await load_content(db_pool)'),
    'await load_content(db_pool) должен присутствовать при contentCache=true');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК D: Синтаксис Python OK
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: Синтаксис Python ────────────────────────────────────');

test('D01', 'Синтаксис OK: contentCache=true', () => {
  syntax(gen('D01', true), 'D01');
});

test('D02', 'Синтаксис OK: contentCache=false', () => {
  syntax(gen('D02', false), 'D02');
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
