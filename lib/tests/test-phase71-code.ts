/**
 * @fileoverview Интеграционные тесты узла code (фаза 71)
 *
 * Блок A: Базовая генерация
 * Блок B: Telethon / client
 * Блок C: Автопереход и синтаксис
 * Блок D: Граничные случаи
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

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase71_${label}`, userDatabaseEnabled: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p71_${label}.py`;
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

function makeCodeNode(id: string, opts: any = {}) {
  return {
    id, type: 'code' as any, position: { x: 0, y: 0 },
    data: {
      code: opts.code || 'result = 42',
      autoTransitionTo: opts.autoTransitionTo || '',
      enableAutoTransition: !!opts.autoTransitionTo,
    },
  };
}

function makeMessageNode(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

function makeCommandTrigger(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true, description: '', showInMenu: true, adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 71 — Узел code (Python + Telethon)                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'code → handle_callback_', () => {
  const p = makeCleanProject([makeCodeNode('code1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  ok(gen(p, 'a01').includes('handle_callback_code1'), 'handle_callback_code1 должен быть в коде');
});

test('A02', 'содержит _run_code_node и __code_entry', () => {
  const p = makeCleanProject([makeCodeNode('code1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('_run_code_node'), '_run_code_node должен быть');
  ok(code.includes('async def __code_entry'), '__code_entry должен быть');
});

test('A03', 'содержит wait_for и 180', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  const code = gen(p, 'a03');
  ok(code.includes('wait_for'), 'wait_for должен быть');
  ok(code.includes('180'), 'таймаут 180 должен быть');
});

test('A04', 'нет RestrictedPython', () => {
  const p = makeCleanProject([makeCodeNode('code1', { code: 'await client.get_messages("me", limit=1)' })]);
  ok(!gen(p, 'a04').includes('RestrictedPython'), 'RestrictedPython не должен быть');
});

test('A05', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeCodeNode('code1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a05'), 'a05');
});

test('A06', 'блокировка узла code по пользователю', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  const code = gen(p, 'a06');
  ok(code.includes('_get_code_node_lock'), '_get_code_node_lock должен быть');
  ok(!code.includes('_code_node_lock = asyncio.Lock()'), 'глобальная блокировка не должна быть');
});

console.log('── Блок B: Telethon ──────────────────────────────────────────────');

test('B01', 'исходник с await client попадает в файл', () => {
  const p = makeCleanProject([makeCodeNode('code1', { code: 'msgs = await client.get_messages(entity, limit=1)' })]);
  ok(gen(p, 'b01').includes('await client.get_messages'), 'await client.get_messages должен быть в строке исходника');
});

test('B02', 'code включает userbot_client в конфиге', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  const code = gen(p, 'b02');
  ok(code.includes('userbot_client'), 'userbot_client должен создаваться для code');
  ok(code.includes('TelegramClient'), 'TelegramClient должен импортироваться');
});

test('B03', 'namespace содержит client', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  ok(gen(p, 'b03').includes("'client':"), "ключ client в namespace");
});

test('B04', 'namespace содержит bot, set_user_var, all_user_data', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  const code = gen(p, 'b04');
  ok(code.includes("'bot':"), "ключ bot в namespace (для edit_message_text)");
  ok(code.includes("'set_user_var':"), "ключ set_user_var в namespace");
  ok(code.includes("'all_user_data':"), "ключ all_user_data в namespace");
});

test('B05', 'служебные ключи namespace не пишутся в переменные', () => {
  const p = makeCleanProject([makeCodeNode('code1')]);
  const code = gen(p, 'b05');
  ok(code.includes("'all_user_data', 'bot', 'set_user_var'"), "служебные ключи в _CODE_SKIP_KEYS");
});

console.log('── Блок C: Автопереход ───────────────────────────────────────────');

test('C01', 'autoTransitionTo → await handle_callback_msg1', () => {
  const p = makeCleanProject([makeCodeNode('code1', { autoTransitionTo: 'msg1' }), makeMessageNode('msg1')]);
  ok(gen(p, 'c01').includes('await handle_callback_msg1'), 'переход к msg1');
});

test('C02', 'cmd → code → msg синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'code1'),
    makeCodeNode('code1', { code: 'result = 1', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1', 'Готово'),
  ]);
  syntax(gen(p, 'c02'), 'c02');
});

console.log('── Блок D: Граничные случаи ──────────────────────────────────────');

test('D01', 'без code-узлов нет _run_code_node', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  ok(!gen(p, 'd01').includes('_run_code_node'), '_run_code_node не должен генерироваться');
});

test('D02', 'пустой код → обработчик есть', () => {
  const p = makeCleanProject([makeCodeNode('code1', { code: '' })]);
  ok(gen(p, 'd02').includes('handle_callback_code1'), 'обработчик пустого code');
});

test('D03', 'тройные кавычки в исходнике → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'code1'),
    makeCodeNode('code1', { code: 'x = """hello"""\nresult = x', autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd03'), 'd03');
});

console.log('\n══════════════════════════════════════════════════════════════════');
const passed = results.filter(r => r.passed).length;
const failedN = results.filter(r => !r.passed).length;
console.log(`\n📊 Итого: ${passed} ✅ / ${failedN} ❌ из ${results.length} тестов`);

if (failedN > 0) {
  console.log('\n❌ Провалены:');
  results.filter(r => !r.passed).forEach(r => console.log(`   ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}

console.log('\n✅ Все тесты фазы 71 (code) пройдены!\n');
