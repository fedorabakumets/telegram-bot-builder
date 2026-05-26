/**
 * @fileoverview Фазовый тест для узла kick_user
 * Блок A: Базовая генерация (5) | Блок B: Chat ID (3) | Блок C: Автопереход (3)
 * Блок D: Синтаксис Python (4) | Блок E: Интеграция (3) | Блок F: Ключевые проверки (3)
 */
import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: any[]) {
  return { sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }], version: 2, activeSheetId: 'sheet1' };
}
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `PhaseKU_${label}`, userDatabaseEnabled: false, enableComments: false });
}
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_ku_${label}.py`;
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

/** Создаёт узел kick_user */
function makeKickNode(id: string, extra: Record<string, any> = {}) {
  return { id, type: 'kick_user', position: { x: 0, y: 0 }, data: { userIdSource: 'current_user', userIdManual: '', chatIdSource: 'current_chat', chatIdManual: '', ignoreErrors: true, autoTransitionTo: '', ...extra } };
}
function makeCmdNode(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: target, command: cmd, buttons: [], keyboardType: 'none' } };
}
function makeMsgNode(id: string, text = 'Ответ') {
  return { id, type: 'message', position: { x: 400, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false } };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел kick_user                                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ═══ БЛОК A: Базовая генерация ═══
console.log('── Блок A: Базовая генерация ─────────────────────────────────────');
test('A1', 'current_user → callback_query.from_user.id', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1')]), 'a1');
  ok(code.includes('callback_query.from_user.id'), 'callback_query.from_user.id должен быть');
});
test('A2', 'reply_user → reply_to_message', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { userIdSource: 'reply_user' })]), 'a2');
  ok(code.includes('reply_to_message'), 'reply_to_message должен быть');
});
test('A3', 'custom {target_id} → replace_variables_in_text', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { userIdSource: 'custom', userIdManual: '{target_id}' })]), 'a3');
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text должен быть');
});
test('A4', 'custom 123456789 → числовой ID', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { userIdSource: 'custom', userIdManual: '123456789' })]), 'a4');
  ok(code.includes('123456789'), '123456789 должен быть');
});
test('A5', 'все варианты → валидный Python', () => {
  for (const n of [makeKickNode('ku_a', { userIdSource: 'current_user' }), makeKickNode('ku_b', { userIdSource: 'reply_user' }), makeKickNode('ku_c', { userIdSource: 'custom', userIdManual: '{x}' })]) {
    syntax(gen(makeCleanProject([n]), `a5_${n.id}`), `a5_${n.id}`);
  }
});

// ═══ БЛОК B: Chat ID ═══
console.log('── Блок B: Chat ID ───────────────────────────────────────────────');
test('B1', 'current_chat → callback_query.message.chat.id', () => {
  ok(gen(makeCleanProject([makeKickNode('ku1')]), 'b1').includes('callback_query.message.chat.id'), 'должен быть');
});
test('B2', 'custom -1001234567890 → подставляет ID', () => {
  ok(gen(makeCleanProject([makeKickNode('ku1', { chatIdSource: 'custom', chatIdManual: '-1001234567890' })]), 'b2').includes('-1001234567890'), 'ID должен быть');
});
test('B3', 'custom {chat_var} → через переменную', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { chatIdSource: 'custom', chatIdManual: '{chat_var}' })]), 'b3');
  ok(code.includes('replace_variables_in_text') && code.includes('chat_var'), 'переменная должна быть');
});

// ═══ БЛОК C: Автопереход ═══
console.log('── Блок C: Автопереход ───────────────────────────────────────────');
test('C1', 'autoTransitionTo=msg1 → handle_callback_msg1', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { autoTransitionTo: 'msg1' }), makeMsgNode('msg1')]), 'c1');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть');
});
test('C2', 'без autoTransitionTo → нет handle_callback_ вызовов', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1')]), 'c2');
  const start = code.indexOf('async def handle_callback_ku1');
  const end = code.indexOf('\n# @@NODE_START', start);
  const handler = code.substring(start, end > -1 ? end : code.length);
  ok(handler.split('\n').filter(l => l.includes('await handle_callback_') && !l.includes('handle_callback_ku1')).length === 0, 'не должно быть вызовов');
});
test('C3', 'command_trigger → kick_user → message', () => {
  const code = gen(makeCleanProject([makeCmdNode('cmd1', '/kick', 'ku1'), makeKickNode('ku1', { autoTransitionTo: 'msg1' }), makeMsgNode('msg1')]), 'c3');
  ok(code.includes('handle_callback_ku1') && code.includes('handle_callback_msg1'), 'оба обработчика должны быть');
});

// ═══ БЛОК D: Синтаксис Python ═══
console.log('── Блок D: Синтаксис Python ──────────────────────────────────────');
test('D1', 'current_user → валидный Python', () => { syntax(gen(makeCleanProject([makeKickNode('ku1')]), 'd1'), 'd1'); });
test('D2', 'reply_user → валидный Python', () => { syntax(gen(makeCleanProject([makeKickNode('ku1', { userIdSource: 'reply_user' })]), 'd2'), 'd2'); });
test('D3', 'custom user + custom chat → валидный Python', () => {
  syntax(gen(makeCleanProject([makeKickNode('ku1', { userIdSource: 'custom', userIdManual: '{uid}', chatIdSource: 'custom', chatIdManual: '{cid}' })]), 'd3'), 'd3');
});
test('D4', 'полный сценарий с autoTransition → валидный Python', () => {
  syntax(gen(makeCleanProject([makeCmdNode('cmd1', '/kick', 'ku1'), makeKickNode('ku1', { autoTransitionTo: 'msg1', userIdSource: 'custom', userIdManual: '{uid}' }), makeMsgNode('msg1')]), 'd4'), 'd4');
});

// ═══ БЛОК E: Интеграция ═══
console.log('── Блок E: Интеграция ────────────────────────────────────────────');
test('E1', 'callback_trigger → kick_user → message (валидный Python)', () => {
  const cb = { id: 'cb1', type: 'callback_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'ku1', callbackData: 'cb1', matchType: 'exact', adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
  const code = gen(makeCleanProject([cb, makeKickNode('ku1', { autoTransitionTo: 'msg1' }), makeMsgNode('msg1')]), 'e1');
  ok(code.includes('handle_callback_ku1'), 'ku1 должен быть'); syntax(code, 'e1');
});
test('E2', 'несколько kick_user в проекте', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1'), makeKickNode('ku2', { userIdSource: 'reply_user' }), makeKickNode('ku3', { userIdSource: 'custom', userIdManual: '111' })]), 'e2');
  ok(code.includes('handle_callback_ku1') && code.includes('handle_callback_ku2') && code.includes('handle_callback_ku3'), 'все обработчики'); syntax(code, 'e2');
});
test('E3', 'kick_user не дублирует обработчик (NODE_TYPES_WITH_DEDICATED_HANDLERS)', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Кик', buttons: [{ id: 'b1', text: 'Кик', action: 'goto', targetNodeId: 'ku1' }], keyboardType: 'inline', formatMode: 'none', markdown: false } };
  const code = gen(makeCleanProject([msg, makeKickNode('ku1')]), 'e3');
  const m = code.match(/async def handle_callback_ku1/g) || [];
  ok(m.length === 1, `handle_callback_ku1 ровно 1 раз, найдено: ${m.length}`);
});

// ═══ БЛОК F: Ключевые проверки ═══
console.log('── Блок F: Ключевые проверки ─────────────────────────────────────');
test('F1', 'содержит bot.unban_chat_member', () => {
  ok(gen(makeCleanProject([makeKickNode('ku1')]), 'f1').includes('bot.unban_chat_member'), 'bot.unban_chat_member должен быть');
});
test('F2', 'содержит only_if_banned=False', () => {
  ok(gen(makeCleanProject([makeKickNode('ku1')]), 'f2').includes('only_if_banned=False'), 'only_if_banned=False должен быть');
});
test('F3', 'ignoreErrors=true → автопереход в блоке except', () => {
  const code = gen(makeCleanProject([makeKickNode('ku1', { ignoreErrors: true, autoTransitionTo: 'msg1' }), makeMsgNode('msg1')]), 'f3');
  const errIdx = code.indexOf('logging.error(f"Ошибка в kick_user ku1');
  ok(errIdx > -1, 'logging.error должен быть');
  ok(code.substring(errIdx, errIdx + 200).includes('handle_callback_msg1'), 'автопереход в except');
});

// ─── Итоги ───
const passed = results.filter(r => r.passed).length, failed = results.length - passed;
console.log(`\n  Итого: ${passed}/${results.length} пройдено${failed > 0 ? `, ${failed} провалено` : ''}\n`);
if (failed > 0) { results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`)); process.exit(1); }
else { console.log('✅ Все тесты пройдены!\n'); process.exit(0); }
