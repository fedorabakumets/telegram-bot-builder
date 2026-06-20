/**
 * @fileoverview Фаза 68 — Гейт генерации защиты контента (PROTECT_CONTENT)
 *
 * Раньше код защиты контента (обёртка `_wrap_bot_protect_content` + флаг
 * `PROTECT_CONTENT`) генерировался ВСЕГДА, а включался рантайм-флагом env
 * `PROTECT_CONTENT`. Теперь при выключенной защите (`protectContent=false`
 * или флаг не задан) этот код не генерируется вовсе.
 *
 * Блоки:
 *  A. protectContent=true → код защиты присутствует
 *  B. protectContent=false / не задан → кода защиты НЕТ
 *  C. Синтаксис Python OK для обоих вариантов
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
    activeSheetId: 'sheet-protect',
    sheets: [{
      id: 'sheet-protect',
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
 * Генерирует Python-код с заданной опцией защиты контента
 * @param label - Метка для имени бота
 * @param protectContent - Включить защиту контента (undefined → не задано)
 */
function gen(label: string, protectContent?: boolean): string {
  return generatePythonCode(startProject(), {
    botName: `ProtectContent_${label}`,
    enableComments: false,
    userDatabaseEnabled: false,
    ...(protectContent === undefined ? {} : { protectContent }),
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_protect_${label}.py`;
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
console.log('║   Фаза 68 — Гейт генерации защиты контента (PROTECT_CONTENT) ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК A: protectContent=true → код защиты присутствует
// ═══════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: protectContent=true → код защиты присутствует ───────');

test('A01', 'обёртка _wrap_bot_protect_content присутствует при protectContent=true', () => {
  ok(gen('A01', true).includes('def _wrap_bot_protect_content'),
    '_wrap_bot_protect_content отсутствует при protectContent: true');
});

test('A02', 'флаг PROTECT_CONTENT = os.getenv присутствует при protectContent=true', () => {
  ok(gen('A02', true).includes('PROTECT_CONTENT = os.getenv'),
    'PROTECT_CONTENT = os.getenv отсутствует при protectContent: true');
});

test('A03', 'вызов _wrap_bot_protect_content(bot) присутствует при protectContent=true', () => {
  ok(gen('A03', true).includes('_wrap_bot_protect_content(bot)'),
    'Вызов _wrap_bot_protect_content(bot) отсутствует при protectContent: true');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК B: protectContent=false / не задан → кода защиты НЕТ
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: protectContent=false / не задан → кода защиты НЕТ ────');

test('B01', 'обёртка _wrap_bot_protect_content отсутствует при protectContent=false', () => {
  const code = gen('B01', false);
  ok(!code.includes('_wrap_bot_protect_content'),
    '_wrap_bot_protect_content присутствует при protectContent: false — лишний код');
});

test('B02', 'флаг PROTECT_CONTENT отсутствует при protectContent=false', () => {
  const code = gen('B02', false);
  ok(!code.includes('PROTECT_CONTENT = os.getenv'),
    'PROTECT_CONTENT = os.getenv присутствует при protectContent: false — лишний код');
});

test('B03', 'код защиты отсутствует если protectContent не задан (дефолт false)', () => {
  const code = gen('B03');
  ok(!code.includes('_wrap_bot_protect_content'),
    '_wrap_bot_protect_content присутствует при незаданном protectContent — дефолт должен быть false');
  ok(!code.includes('PROTECT_CONTENT = os.getenv'),
    'PROTECT_CONTENT присутствует при незаданном protectContent — дефолт должен быть false');
});

// ═══════════════════════════════════════════════════════════════════════════════
// БЛОК C: Синтаксис Python OK для обоих вариантов
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: Синтаксис Python ────────────────────────────────────');

test('C01', 'Синтаксис Python OK при protectContent=true', () => {
  syntax(gen('C01', true), 'C01');
});

test('C02', 'Синтаксис Python OK при protectContent=false', () => {
  syntax(gen('C02', false), 'C02');
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
