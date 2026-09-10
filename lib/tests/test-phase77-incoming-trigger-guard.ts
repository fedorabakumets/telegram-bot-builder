/**
 * @fileoverview Фазовые тесты примитивов охраны группы (phase77)
 *
 * Блок A: incoming_message_trigger — фильтры чата
 * Блок B: incoming_message_trigger — _stop_processing
 * Блок C: stop_processing узел
 * Блок D: интеграция imt + stop
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: unknown[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase77_${label}`, userDatabaseEnabled: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p77_${label}.py`;
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

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

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

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

function makeImtNode(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
      imtChatTypeFilter: 'any',
      imtStopOnFlag: true,
      ...extra,
    },
  };
}

function makeMessageNode(id: string) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: 'OK', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

function makeStopNode(id: string, targetId = '') {
  return {
    id,
    type: 'stop_processing',
    position: { x: 200, y: 0 },
    data: { autoTransitionTo: targetId },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase77 — охрана группы (imt + stop_processing)       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Фильтры incoming_message_trigger ─────────────────────');

test('A01', 'imtChatTypeFilter=private → проверка private в middleware', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1', { imtChatTypeFilter: 'private' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes("_imt_chat_type != 'private'"), 'должна быть проверка private');
});

test('A02', 'imtChatTypeFilter=group → проверка group/supergroup', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1', { imtChatTypeFilter: 'group' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes("'group', 'supergroup'"), 'должна быть проверка group/supergroup');
});

test('A03', 'imtGroupChatId manual → expected chat ids', () => {
  const p = makeCleanProject([
    makeImtNode('imt1', 'msg1', { imtChatTypeFilter: 'group', imtGroupChatId: '12345', imtGroupChatIdSource: 'manual' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a03');
  ok(code.includes("'12345'"), 'должен быть ID группы');
  ok(code.includes("'-10012345'"), 'должен быть ID с префиксом -100');
});

test('A04', 'imtGroupChatIdSource=variable → replace_variables_in_text', () => {
  const p = makeCleanProject([
    makeImtNode('imt1', 'msg1', {
      imtChatTypeFilter: 'group',
      imtGroupChatIdSource: 'variable',
      groupChatVariableName: 'my_group_id',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a04');
  ok(code.includes('my_group_id'), 'должна использоваться переменная группы');
});

test('A05', 'фильтры group → синтаксис OK', () => {
  const p = makeCleanProject([
    makeImtNode('imt1', 'msg1', { imtChatTypeFilter: 'group', imtGroupChatId: '999' }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'a05'), 'a05');
});

console.log('── Блок B: _stop_processing в middleware ────────────────────────');

test('B01', 'imtStopOnFlag=true → проверка _stop_processing и return None', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1', { imtStopOnFlag: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes("_stop_processing"), 'должен быть _stop_processing');
  ok(code.includes('return None'), 'должен быть return None');
});

test('B02', 'сброс _stop_processing вместе с _imt_handled', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('pop("_imt_handled", None)'), 'сброс _imt_handled');
  ok(code.includes('pop("_stop_processing", None)'), 'сброс _stop_processing');
});

test('B03', 'imtStopOnFlag=false → нет return None по флагу', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1', { imtStopOnFlag: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  const idx = code.indexOf('incoming_message_trigger_imt1_middleware');
  const body = code.substring(idx, code.indexOf('\nasync def ', idx + 1));
  ok(!body.includes('return None'), 'не должно быть return None при stopOnFlag=false');
});

console.log('── Блок C: stop_processing узел ───────────────────────────────────');

test('C01', 'stop_processing → устанавливает флаг', () => {
  const p = makeCleanProject([makeStopNode('stop1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('user_data[user_id]["_stop_processing"] = True'), 'установка флага');
});

test('C02', 'stop_processing → callback handler', () => {
  const p = makeCleanProject([makeStopNode('stop1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('handle_callback_stop1'), 'обработчик stop1');
});

test('C03', 'stop_processing → синтаксис OK', () => {
  const p = makeCleanProject([makeStopNode('stop1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'stop_processing → ровно один handle_callback_stop1 (без заглушки)', () => {
  const p = makeCleanProject([makeStopNode('stop1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c04');
  const defs = code.match(/async def handle_callback_stop1\(/g) || [];
  ok(defs.length === 1, `ожидали 1 def handle_callback_stop1, получили ${defs.length}`);
  ok(code.includes('user_data[user_id]["_stop_processing"] = True'), 'живой handler должен ставить флаг');
});

console.log('── Блок D: Интеграция ───────────────────────────────────────────');

test('D01', 'imt + stop_processing в одном проекте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeImtNode('imt1', 'stop1'),
    makeStopNode('stop1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd01'), 'd01');
});

test('D02', 'capture_message_context сохраняется', () => {
  const p = makeCleanProject([makeImtNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'd02');
  ok(code.includes('await capture_message_context(user_id, event)'), 'capture_message_context');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\nИтог phase77: ${passed}/${results.length} пройдено, провалено: ${failed}\n`);
if (failed > 0) process.exit(1);
