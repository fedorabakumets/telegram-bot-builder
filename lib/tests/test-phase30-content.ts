/**
 * @fileoverview Фазовый интеграционный тест для шаблона загрузки контента (_content)
 *
 * Блок A: Базовая генерация content-секции (с projectId)
 * Блок B: Без projectId — content-секция НЕ генерируется
 * Блок C: Интеграция с message-нодой (get_content в тексте)
 * Блок D: Вызовы в main()
 * Блок E: Полные сценарии
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string, withContent = true): string {
  return generatePythonCode(project as any, {
    botName: `Phase30_${label}`,
    userDatabaseEnabled: withContent,
    enableComments: false,
    projectId: withContent ? 245 : null,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p30_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try { execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' }); fs.unlinkSync(tmp); return { ok: true }; }
  catch (e: any) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, error: e.stderr?.toString() ?? String(e) }; }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

function test(id: string, name: string, fn: () => void) {
  try { fn(); results.push({ id, name, passed: true, note: 'OK' }); console.log(`  ✅ ${id}. ${name}`); }
  catch (e: any) { results.push({ id, name, passed: false, note: e.message }); console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`); }
}

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) { const r = checkSyntax(code, label); ok(r.ok, `Синтаксическая ошибка:\n${r.error}`); }

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function makeMessageNode(id: string, text: string) {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

function makeCommandTrigger(id: string, command: string, targetId: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command, description: 'Описание', showInMenu: true, autoTransitionTo: targetId, buttons: [], keyboardType: 'none' } };
}

// ─── Запуск ──────────────────────────────────────────────────────────────────

console.log('\n═══ Фаза 30: Загрузка контента (_content) ═══\n');

// ─── Блок A: Базовая генерация content-секции ────────────────────────────────
console.log('Блок A: Базовая генерация content-секции');
const projA = makeCleanProject([makeMessageNode('msg1', 'Привет!')]);
const codeA = gen(projA, 'A');

test('A1', 'Код содержит _content_cache', () => ok(codeA.includes('_content_cache'), 'Нет _content_cache'));
test('A2', 'Код содержит load_content', () => ok(codeA.includes('load_content'), 'Нет load_content'));
test('A3', 'Код содержит get_content', () => ok(codeA.includes('get_content'), 'Нет get_content'));
test('A4', 'Код содержит _content_reload_loop', () => ok(codeA.includes('_content_reload_loop'), 'Нет _content_reload_loop'));
test('A5', 'Код содержит reload_content', () => ok(codeA.includes('reload_content'), 'Нет reload_content'));
test('A6', 'Код содержит projectId (245) в SQL', () => ok(codeA.includes('245'), 'Нет projectId 245'));
test('A7', 'Код содержит asyncio.sleep(60)', () => ok(codeA.includes('asyncio.sleep(60)'), 'Нет asyncio.sleep(60)'));
test('A8', 'Синтаксис Python валиден', () => syntax(codeA, 'A8'));

// ─── Блок B: Без projectId ───────────────────────────────────────────────────
console.log('\nБлок B: Без projectId');
const projB = makeCleanProject([makeMessageNode('msg1', 'Привет!')]);
const codeB = gen(projB, 'B', false);

test('B1', 'Код НЕ содержит _content_cache', () => ok(!codeB.includes('_content_cache'), 'Найден _content_cache'));
test('B2', 'Код НЕ содержит load_content', () => ok(!codeB.includes('load_content'), 'Найден load_content'));
test('B3', 'Код НЕ содержит get_content', () => ok(!codeB.includes('get_content'), 'Найден get_content'));
test('B4', 'Синтаксис Python валиден (без content)', () => syntax(codeB, 'B4'));

// ─── Блок C: Интеграция с message-нодой ──────────────────────────────────────
console.log('\nБлок C: Интеграция с message-нодой');
const projC = makeCleanProject([makeCommandTrigger('cmd1', 'start', 'msg_c'), makeMessageNode('msg_c', 'Текст из контента')]);
const codeC = gen(projC, 'C');
const codeCno = gen(projC, 'Cno', false);

test('C1', 'С projectId — текст использует get_content("msg_c", ...)', () => ok(codeC.includes('get_content("msg_c"'), 'Нет get_content("msg_c"...)'));
test('C2', 'С projectId — fallback содержит оригинальный текст', () => ok(codeC.includes('Текст из контента'), 'Нет fallback текста'));
test('C3', 'Без projectId — текст НЕ использует get_content', () => ok(!codeCno.includes('get_content'), 'Найден get_content без projectId'));
test('C4', 'Синтаксис Python валиден (message + content)', () => syntax(codeC, 'C4'));

// ─── Блок D: Вызовы в main() ────────────────────────────────────────────────
console.log('\nБлок D: Вызовы в main()');
const codeD = codeA;
const codeDno = codeB;

test('D1', 'С projectId — main содержит await load_content(db_pool)', () => ok(codeD.includes('await load_content(db_pool)'), 'Нет await load_content(db_pool)'));
test('D2', 'С projectId — main содержит _content_reload_loop(db_pool)', () => ok(codeD.includes('_content_reload_loop(db_pool)'), 'Нет _content_reload_loop(db_pool)'));
test('D3', 'Без projectId — main НЕ содержит load_content', () => ok(!codeDno.includes('load_content'), 'Найден load_content без projectId'));

// ─── Блок E: Полные сценарии ─────────────────────────────────────────────────
console.log('\nБлок E: Полные сценарии');
const projE1 = makeCleanProject([
  makeCommandTrigger('cmd_e1', 'start', 'msg_e1'),
  makeMessageNode('msg_e1', 'Первое сообщение'),
  makeCommandTrigger('cmd_e2', 'help', 'msg_e2'),
  makeMessageNode('msg_e2', 'Второе сообщение'),
]);
const codeE1 = gen(projE1, 'E1');

test('E1', 'Несколько message-нод — все используют get_content с разными ключами', () => {
  ok(codeE1.includes('get_content("msg_e1"'), 'Нет get_content("msg_e1"...)');
  ok(codeE1.includes('get_content("msg_e2"'), 'Нет get_content("msg_e2"...)');
});

test('E2', 'command_trigger + message — description в таблице, messageText через get_content', () => {
  ok(codeE1.includes('get_content("msg_e1"'), 'Нет get_content для message');
  ok(codeE1.includes('Описание') || codeE1.includes('description'), 'Нет description в коде');
});

test('E3', 'Синтаксис Python валиден (полный сценарий)', () => syntax(codeE1, 'E3'));

// ─── Итоги ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n═══ Итого: ${passed} passed, ${failed} failed из ${results.length} ═══`);
if (failed > 0) {
  console.log('\nПровалены:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}
