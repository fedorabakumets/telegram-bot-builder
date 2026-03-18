/**
 * @fileoverview Фаза 8 — Автопереход — JSON-мутации
 *
 * Блок A: Базовый автопереход (start → message)
 * Блок B: Автопереход из message → message
 * Блок C: Автопереход из command → message
 * Блок D: enableAutoTransition:false — нет кода автоперехода
 * Блок E: autoTransitionTo — несуществующий узел
 * Блок F: Цепочки автопереходов (A→B→C)
 * Блок G: Автопереход + клавиатура (inline/reply/none)
 * Блок H: Автопереход + collectUserInput
 * Блок I: Автопереход + медиа (imageUrl, videoUrl)
 * Блок J: Автопереход + formatMode (html/markdown)
 * Блок K: hasAutoTransitions → импорты (TelegramBadRequest, safe_edit_or_send)
 * Блок L: FakeCallbackQuery структура
 * Блок M: autoTransitionTo с дефисами в ID
 * Блок N: Граничные случаи (пустой autoTransitionTo, enableAutoTransition без target)
 * Блок O: Автопереход + userDatabaseEnabled
 * Блок P: Несколько узлов с автопереходом в одном проекте
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

/** Патчит start-узел (nodes[0]) */
function patchStart(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[0].data, patch);
  return p;
}

/** Патчит message-узел (nodes[1]) */
function patchMsg(patch: Record<string, unknown>) {
  const p = clone(BASE);
  Object.assign(p.sheets[0].nodes[1].data, patch);
  return p;
}

/** Добавляет узел типа message с заданными данными */
function addMsgNode(id: string, data: Record<string, unknown> = {}) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: `Узел ${id}`,
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
      enableAutoTransition: false,
      autoTransitionTo: '',
      collectUserInput: false,
      attachedMedia: [],
      ...data,
    },
  };
}

/** Добавляет узел типа command */
function addCmdNode(id: string, command: string, data: Record<string, unknown> = {}) {
  return {
    id,
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command,
      messageText: `Команда ${command}`,
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
      enableAutoTransition: false,
      autoTransitionTo: '',
      attachedMedia: [],
      ...data,
    },
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase8_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase8DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p8_${label}.py`;
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

// ─── Раннер ──────────────────────────────────────────────────────────────────

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

function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         Фаза 8 — Автопереход (80+ тестов)                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовый автопереход (start → message)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовый автопереход (start → message) ─────────────────');

test('A01', 'start: enableAutoTransition:true + autoTransitionTo → АВТОПЕРЕХОД в коде', () => {
  const targetId = BASE.sheets[0].nodes[1].id; // nodes[1] — message
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a01');
  syntax(code, 'a01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть в коде');
  ok(code.includes(targetId), 'ID целевого узла должен быть в коде');
});

test('A02', 'start: FakeCallbackQuery класс генерируется', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a02');
  syntax(code, 'a02');
  ok(code.includes('class FakeCallbackQuery:'), 'FakeCallbackQuery класс должен быть');
  ok(code.includes('def __init__(self, message, target_node_id):'), '__init__ должен быть');
  ok(code.includes('self._is_fake = True'), '_is_fake должен быть');
});

test('A03', 'start: вызов handle_callback_<targetId> генерируется', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const safeName = targetId.replace(/-/g, '_');
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a03');
  syntax(code, 'a03');
  ok(code.includes(`handle_callback_${safeName}`), `handle_callback_${safeName} должен быть`);
});

test('A04', 'start: fake_callback = FakeCallbackQuery(message, "targetId")', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a04');
  syntax(code, 'a04');
  ok(code.includes(`FakeCallbackQuery(message, "${targetId}")`), 'fake_callback создаётся с правильными аргументами');
});

test('A05', 'start: logging.info автопереход выполнен', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a05');
  syntax(code, 'a05');
  ok(code.includes('Автопереход выполнен'), 'лог успешного автоперехода должен быть');
});

test('A06', 'start: except блок с logging.error', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a06');
  syntax(code, 'a06');
  ok(code.includes('logging.error'), 'logging.error в except должен быть');
  ok(code.includes('Переход завершен'), 'fallback сообщение должно быть');
});

test('A07', 'start: return после автоперехода', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a07');
  syntax(code, 'a07');
  // return должен быть после блока автоперехода
  const autoIdx = code.indexOf('АВТОПЕРЕХОД');
  const returnIdx = code.indexOf('return', autoIdx);
  ok(returnIdx > autoIdx, 'return должен быть после АВТОПЕРЕХОД');
});

test('A08', 'start: await перед handle_callback', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const safeName = targetId.replace(/-/g, '_');
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'a08');
  syntax(code, 'a08');
  ok(code.includes(`await handle_callback_${safeName}(fake_callback)`), 'await должен быть перед handle_callback');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Автопереход из message → message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Автопереход из message → message ──────────────────────');

test('B01', 'message: enableAutoTransition:true → АВТОПЕРЕХОД в коде', () => {
  const p = clone(BASE);
  const targetId = 'target_msg_b01';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'b01');
  syntax(code, 'b01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes(targetId), 'ID целевого узла должен быть');
});

test('B02', 'message: FakeCallbackQuery использует callback_query.message', () => {
  const p = clone(BASE);
  const targetId = 'target_msg_b02';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'b02');
  syntax(code, 'b02');
  ok(code.includes('FakeCallbackQuery(callback_query.message,'), 'message: FakeCallbackQuery должен использовать callback_query.message');
});

test('B03', 'message: handle_callback_<targetId> вызывается', () => {
  const p = clone(BASE);
  const targetId = 'target-msg-b03';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const safeName = targetId.replace(/-/g, '_');
  const code = gen(p, 'b03');
  syntax(code, 'b03');
  ok(code.includes(`handle_callback_${safeName}`), `handle_callback_${safeName} должен быть`);
});

test('B04', 'message: return после автоперехода', () => {
  const p = clone(BASE);
  const targetId = 'target_msg_b04';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'b04');
  syntax(code, 'b04');
  const autoIdx = code.indexOf('АВТОПЕРЕХОД');
  const returnIdx = code.indexOf('return', autoIdx);
  ok(returnIdx > autoIdx, 'return должен быть после АВТОПЕРЕХОД');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Автопереход из command → message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Автопереход из command → message ──────────────────────');

test('C01', 'command: enableAutoTransition:true → АВТОПЕРЕХОД в коде', () => {
  const p = clone(BASE);
  const targetId = 'target_cmd_c01';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  p.sheets[0].nodes.push(addCmdNode('cmd_c01', '/info', {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
  }));
  const code = gen(p, 'c01');
  syntax(code, 'c01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть в command-узле');
  ok(code.includes(targetId), 'ID целевого узла должен быть');
});

test('C02', 'command: FakeCallbackQuery генерируется', () => {
  const p = clone(BASE);
  const targetId = 'target_cmd_c02';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  p.sheets[0].nodes.push(addCmdNode('cmd_c02', '/go', {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
  }));
  const code = gen(p, 'c02');
  syntax(code, 'c02');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в command-узле');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: enableAutoTransition:false — нет кода автоперехода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: enableAutoTransition:false ────────────────────────────');

test('D01', 'start: enableAutoTransition:false → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchStart({ enableAutoTransition: false, autoTransitionTo: 'some_node' }), 'd01');
  syntax(code, 'd01');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при false');
  ok(!code.includes('FakeCallbackQuery'), 'FakeCallbackQuery не должен быть при false');
});

test('D02', 'message: enableAutoTransition:false → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchMsg({ enableAutoTransition: false, autoTransitionTo: 'some_node' }), 'd02');
  syntax(code, 'd02');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при false');
});

test('D03', 'start: enableAutoTransition:true но autoTransitionTo пустой → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: '' }), 'd03');
  syntax(code, 'd03');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при пустом autoTransitionTo');
  ok(!code.includes('FakeCallbackQuery'), 'FakeCallbackQuery не должен быть');
});

test('D04', 'start: enableAutoTransition не задан → нет АВТОПЕРЕХОД', () => {
  const p = clone(BASE);
  delete p.sheets[0].nodes[0].data.enableAutoTransition;
  delete p.sheets[0].nodes[0].data.autoTransitionTo;
  const code = gen(p, 'd04');
  syntax(code, 'd04');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть без поля');
});

test('D05', 'message: enableAutoTransition:true, autoTransitionTo:undefined → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchMsg({ enableAutoTransition: true }), 'd05');
  syntax(code, 'd05');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть без autoTransitionTo');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: autoTransitionTo — несуществующий узел
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: autoTransitionTo — несуществующий узел ────────────────');

test('E01', 'start: autoTransitionTo несуществующий → код генерируется (синтаксис OK)', () => {
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: 'nonexistent_node_xyz' }), 'e01');
  syntax(code, 'e01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть даже для несуществующего узла');
  ok(code.includes('nonexistent_node_xyz'), 'ID несуществующего узла должен быть в коде');
});

test('E02', 'start: autoTransitionTo несуществующий → handle_callback_nonexistent_node_xyz', () => {
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: 'nonexistent_node_xyz' }), 'e02');
  syntax(code, 'e02');
  ok(code.includes('handle_callback_nonexistent_node_xyz'), 'handle_callback для несуществующего узла должен быть');
});

test('E03', 'message: autoTransitionTo несуществующий → синтаксис OK', () => {
  const code = gen(patchMsg({ enableAutoTransition: true, autoTransitionTo: 'ghost_node_999' }), 'e03');
  syntax(code, 'e03');
  ok(code.includes('ghost_node_999'), 'ID несуществующего узла должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Цепочки автопереходов (A→B→C)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Цепочки автопереходов ─────────────────────────────────');

test('F01', 'цепочка start→msg_b→msg_c: все три узла генерируются', () => {
  const p = clone(BASE);
  const idB = 'chain_b_f01';
  const idC = 'chain_c_f01';
  // start → idB
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: idB });
  // idB → idC
  p.sheets[0].nodes.push(addMsgNode(idB, { enableAutoTransition: true, autoTransitionTo: idC }));
  p.sheets[0].nodes.push(addMsgNode(idC));
  const code = gen(p, 'f01');
  syntax(code, 'f01');
  ok(code.includes(idB), 'узел B должен быть в коде');
  ok(code.includes(idC), 'узел C должен быть в коде');
  ok(code.includes(`handle_callback_${idB}`), 'handle_callback_B должен быть');
  ok(code.includes(`handle_callback_${idC}`), 'handle_callback_C должен быть');
});

test('F02', 'цепочка из 3 автопереходов: 2 АВТОПЕРЕХОД блока', () => {
  const p = clone(BASE);
  const idB = 'chain_b_f02';
  const idC = 'chain_c_f02';
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: idB });
  p.sheets[0].nodes.push(addMsgNode(idB, { enableAutoTransition: true, autoTransitionTo: idC }));
  p.sheets[0].nodes.push(addMsgNode(idC));
  const code = gen(p, 'f02');
  syntax(code, 'f02');
  const count = (code.match(/АВТОПЕРЕХОД/g) || []).length;
  ok(count >= 2, `должно быть минимум 2 блока АВТОПЕРЕХОД, найдено: ${count}`);
});

test('F03', 'цепочка msg→msg→msg: все три FakeCallbackQuery', () => {
  const p = clone(BASE);
  const idA = p.sheets[0].nodes[1].id;
  const idB = 'chain_b_f03';
  const idC = 'chain_c_f03';
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: idB });
  p.sheets[0].nodes.push(addMsgNode(idB, { enableAutoTransition: true, autoTransitionTo: idC }));
  p.sheets[0].nodes.push(addMsgNode(idC));
  const code = gen(p, 'f03');
  syntax(code, 'f03');
  const fakeCount = (code.match(/class FakeCallbackQuery:/g) || []).length;
  ok(fakeCount >= 2, `должно быть минимум 2 FakeCallbackQuery, найдено: ${fakeCount}`);
});

test('F04', 'цепочка 4 узлов: синтаксис OK', () => {
  const p = clone(BASE);
  const ids = ['chain_d1', 'chain_d2', 'chain_d3', 'chain_d4'];
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: ids[0] });
  p.sheets[0].nodes.push(addMsgNode(ids[0], { enableAutoTransition: true, autoTransitionTo: ids[1] }));
  p.sheets[0].nodes.push(addMsgNode(ids[1], { enableAutoTransition: true, autoTransitionTo: ids[2] }));
  p.sheets[0].nodes.push(addMsgNode(ids[2], { enableAutoTransition: true, autoTransitionTo: ids[3] }));
  p.sheets[0].nodes.push(addMsgNode(ids[3]));
  const code = gen(p, 'f04');
  syntax(code, 'f04');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Автопереход + клавиатура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Автопереход + клавиатура ──────────────────────────────');

test('G01', 'start: автопереход + keyboardType=inline → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: targetId, hideAfterClick: false, skipDataCollection: false }],
  }), 'g01');
  syntax(code, 'g01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('InlineKeyboard'), 'InlineKeyboard должен быть');
});

test('G02', 'start: автопереход + keyboardType=reply → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    keyboardType: 'reply',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: targetId, hideAfterClick: false, skipDataCollection: false }],
  }), 'g02');
  syntax(code, 'g02');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('G03', 'start: автопереход + keyboardType=none → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    keyboardType: 'none',
    buttons: [],
  }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('G04', 'message: автопереход + inline кнопки → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'target_g04';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    keyboardType: 'inline',
    buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: targetId, hideAfterClick: false, skipDataCollection: false }],
  });
  const code = gen(p, 'g04');
  syntax(code, 'g04');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Автопереход + collectUserInput
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Автопереход + collectUserInput ────────────────────────');

test('H01', 'start: автопереход + collectUserInput:true → оба блока в коде', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'my_input',
    inputTargetNodeId: targetId,
  }), 'h01');
  syntax(code, 'h01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('waiting_for_input'), 'waiting_for_input должен быть');
});

test('H02', 'message: автопереход + collectUserInput:false → только АВТОПЕРЕХОД', () => {
  const p = clone(BASE);
  const targetId = 'target_h02';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    collectUserInput: false,
  });
  const code = gen(p, 'h02');
  syntax(code, 'h02');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(!code.includes('waiting_for_input'), 'waiting_for_input не должен быть при false');
});

test('H03', 'message: автопереход + collectUserInput:true → оба блока', () => {
  const p = clone(BASE);
  const targetId = 'target_h03';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'answer',
    inputTargetNodeId: targetId,
  });
  const code = gen(p, 'h03');
  syntax(code, 'h03');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('waiting_for_input'), 'waiting_for_input должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Автопереход + медиа
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Автопереход + медиа ───────────────────────────────────');

test('I01', 'start: автопереход + imageUrl → answer_photo + АВТОПЕРЕХОД', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    imageUrl: 'https://example.com/photo.jpg',
    attachedMedia: [],
  }), 'i01');
  syntax(code, 'i01');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('I02', 'start: автопереход + videoUrl → answer_video + АВТОПЕРЕХОД', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    videoUrl: 'https://example.com/video.mp4',
    attachedMedia: [],
  }), 'i02');
  syntax(code, 'i02');
  ok(code.includes('answer_video'), 'answer_video должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('I03', 'message: автопереход + imageUrl → answer_photo + АВТОПЕРЕХОД', () => {
  const p = clone(BASE);
  const targetId = 'target_i03';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    imageUrl: 'https://example.com/photo.jpg',
    attachedMedia: [],
  });
  const code = gen(p, 'i03');
  syntax(code, 'i03');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('I04', 'message: автопереход + audioUrl → answer_audio + АВТОПЕРЕХОД', () => {
  const p = clone(BASE);
  const targetId = 'target_i04';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    audioUrl: 'https://example.com/audio.mp3',
    attachedMedia: [],
  });
  const code = gen(p, 'i04');
  syntax(code, 'i04');
  ok(code.includes('answer_audio'), 'answer_audio должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Автопереход + formatMode
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Автопереход + formatMode ──────────────────────────────');

test('J01', 'start: автопереход + formatMode=html → parse_mode="HTML" + АВТОПЕРЕХОД', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    formatMode: 'html',
    messageText: '<b>Привет!</b>',
    attachedMedia: [],
  }), 'j01');
  syntax(code, 'j01');
  ok(code.includes('parse_mode="HTML"'), 'parse_mode="HTML" должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('J02', 'start: автопереход + formatMode=markdown → parse_mode="Markdown" + АВТОПЕРЕХОД', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    formatMode: 'markdown',
    messageText: '**Привет!**',
    attachedMedia: [],
  }), 'j02');
  syntax(code, 'j02');
  ok(code.includes('parse_mode="Markdown"'), 'parse_mode="Markdown" должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('J03', 'message: автопереход + formatMode=html → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'target_j03';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, {
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    formatMode: 'html',
    messageText: '<b>Текст</b>',
    attachedMedia: [],
  });
  const code = gen(p, 'j03');
  syntax(code, 'j03');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: hasAutoTransitions → импорты
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: hasAutoTransitions → импорты ──────────────────────────');

test('K01', 'с автопереходом → TelegramBadRequest импортируется', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'k01');
  syntax(code, 'k01');
  ok(code.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть в импортах');
});

test('K02', 'без автоперехода + без inline кнопок → нет TelegramBadRequest', () => {
  const p = clone(BASE);
  // Убираем все кнопки и автопереходы
  p.sheets[0].nodes.forEach((n: any) => {
    n.data.enableAutoTransition = false;
    n.data.autoTransitionTo = '';
    n.data.buttons = [];
    n.data.keyboardType = 'none';
  });
  const code = gen(p, 'k02');
  syntax(code, 'k02');
  ok(!code.includes('TelegramBadRequest'), 'TelegramBadRequest не должен быть без автоперехода и inline кнопок');
});

test('K03', 'с автопереходом → safe_edit_or_send генерируется', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'k03');
  syntax(code, 'k03');
  ok(code.includes('safe_edit_or_send'), 'safe_edit_or_send должен быть');
});

test('K04', 'с автопереходом → SimpleNamespace импортируется', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'k04');
  syntax(code, 'k04');
  ok(code.includes('SimpleNamespace'), 'SimpleNamespace должен быть в импортах');
});

test('K05', 'несколько узлов с автопереходом → TelegramBadRequest один раз', () => {
  const p = clone(BASE);
  const targetId = BASE.sheets[0].nodes[1].id;
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'k05');
  syntax(code, 'k05');
  const count = (code.match(/TelegramBadRequest/g) || []).length;
  ok(count === 1, `TelegramBadRequest должен быть ровно 1 раз в импортах, найдено: ${count}`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: FakeCallbackQuery структура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: FakeCallbackQuery структура ───────────────────────────');

test('L01', 'FakeCallbackQuery: self.from_user = message.from_user', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'l01');
  syntax(code, 'l01');
  ok(code.includes('self.from_user = message.from_user'), 'from_user должен быть');
});

test('L02', 'FakeCallbackQuery: self.chat = message.chat', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'l02');
  syntax(code, 'l02');
  ok(code.includes('self.chat = message.chat'), 'chat должен быть');
});

test('L03', 'FakeCallbackQuery: self.data = target_node_id', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'l03');
  syntax(code, 'l03');
  ok(code.includes('self.data = target_node_id'), 'data должен быть');
});

test('L04', 'FakeCallbackQuery: async def answer(self, *args, **kwargs)', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'l04');
  syntax(code, 'l04');
  ok(code.includes('async def answer(self, *args, **kwargs):'), 'async answer должен быть');
});

test('L05', 'message: FakeCallbackQuery использует callback_query.message (не message)', () => {
  const p = clone(BASE);
  const targetId = 'target_l05';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'l05');
  syntax(code, 'l05');
  ok(code.includes('FakeCallbackQuery(callback_query.message,'), 'message-узел должен использовать callback_query.message');
});

test('L06', 'start: FakeCallbackQuery использует message (не callback_query.message)', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'l06');
  syntax(code, 'l06');
  ok(code.includes('FakeCallbackQuery(message,'), 'start-узел должен использовать message');
  ok(!code.includes('FakeCallbackQuery(callback_query.message,'), 'start-узел не должен использовать callback_query.message');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: autoTransitionTo с дефисами и спецсимволами в ID
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: autoTransitionTo с дефисами в ID ──────────────────────');

test('M01', 'start: autoTransitionTo с дефисами → handle_callback с подчёркиваниями', () => {
  const p = clone(BASE);
  const targetId = 'node-with-dashes-123';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'm01');
  syntax(code, 'm01');
  ok(code.includes('handle_callback_node_with_dashes_123'), 'дефисы должны заменяться на подчёркивания');
});

test('M02', 'message: autoTransitionTo с дефисами → handle_callback с подчёркиваниями', () => {
  const p = clone(BASE);
  const targetId = 'target-node-m02';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'm02');
  syntax(code, 'm02');
  ok(code.includes('handle_callback_target_node_m02'), 'дефисы должны заменяться на подчёркивания');
});

test('M03', 'autoTransitionTo с UUID-подобным ID → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'm03');
  syntax(code, 'm03');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('M04', 'autoTransitionTo с ID из base64-подобных символов → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'sYCfWgnaiQ3RYmDo_rLtm'; // реальный ID из project.json
  p.sheets[0].nodes.push(addMsgNode(targetId));
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'm04');
  syntax(code, 'm04');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Граничные случаи ──────────────────────────────────────');

test('N01', 'start: autoTransitionTo = nodeId самого себя → синтаксис OK (рекурсия)', () => {
  const nodeId = BASE.sheets[0].nodes[0].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: nodeId }), 'n01');
  syntax(code, 'n01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть даже при самоссылке');
});

test('N02', 'start: enableAutoTransition:true, autoTransitionTo:null → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: null }), 'n02');
  syntax(code, 'n02');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при null');
});

test('N03', 'start: enableAutoTransition:false, autoTransitionTo задан → нет АВТОПЕРЕХОД', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: false, autoTransitionTo: targetId }), 'n03');
  syntax(code, 'n03');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при enableAutoTransition:false');
});

test('N04', 'start: messageText пустой + автопереход → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId, messageText: '' }), 'n04');
  syntax(code, 'n04');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('N05', 'start: messageText со спецсимволами + автопереход → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    messageText: 'Привет "мир"! \\n Новая строка',
  }), 'n05');
  syntax(code, 'n05');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('N06', 'message: enableAutoTransition:true, autoTransitionTo:""  → нет АВТОПЕРЕХОД', () => {
  const code = gen(patchMsg({ enableAutoTransition: true, autoTransitionTo: '' }), 'n06');
  syntax(code, 'n06');
  ok(!code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД не должен быть при пустом autoTransitionTo');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК O: Автопереход + userDatabaseEnabled
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок O: Автопереход + userDatabaseEnabled ─────────────────────');

test('O01', 'start: автопереход + userDatabaseEnabled → TelegramBadRequest + save_user_to_db', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = genDB(patchStart({ enableAutoTransition: true, autoTransitionTo: targetId }), 'o01');
  syntax(code, 'o01');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('save_user_to_db'), 'save_user_to_db должен быть');
  ok(code.includes('TelegramBadRequest'), 'TelegramBadRequest должен быть');
});

test('O02', 'message: автопереход + userDatabaseEnabled → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'target_o02';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = genDB(p, 'o02');
  syntax(code, 'o02');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен быть');
});

test('O03', 'start: автопереход + userDatabaseEnabled + imageUrl → всё вместе', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = genDB(patchStart({
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    imageUrl: 'https://example.com/photo.jpg',
    attachedMedia: [],
  }), 'o03');
  syntax(code, 'o03');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
  ok(code.includes('answer_photo'), 'answer_photo должен быть');
  ok(code.includes('update_user_data_in_db'), 'update_user_data_in_db должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК P: Несколько узлов с автопереходом
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок P: Несколько узлов с автопереходом ───────────────────────');

test('P01', 'start + message оба с автопереходом → оба АВТОПЕРЕХОД блока', () => {
  const p = clone(BASE);
  const targetA = 'target_p01_a';
  const targetB = 'target_p01_b';
  p.sheets[0].nodes.push(addMsgNode(targetA));
  p.sheets[0].nodes.push(addMsgNode(targetB));
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: targetA });
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetB });
  const code = gen(p, 'p01');
  syntax(code, 'p01');
  const count = (code.match(/АВТОПЕРЕХОД/g) || []).length;
  ok(count >= 2, `должно быть минимум 2 АВТОПЕРЕХОД, найдено: ${count}`);
});

test('P02', '5 узлов с автопереходом → синтаксис OK', () => {
  const p = clone(BASE);
  const ids = ['p02_a', 'p02_b', 'p02_c', 'p02_d', 'p02_e'];
  ids.forEach(id => p.sheets[0].nodes.push(addMsgNode(id)));
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: ids[0] });
  // Каждый из добавленных узлов указывает на следующий
  for (let i = 0; i < ids.length - 1; i++) {
    const nodeIdx = p.sheets[0].nodes.findIndex((n: any) => n.id === ids[i]);
    p.sheets[0].nodes[nodeIdx].data.enableAutoTransition = true;
    p.sheets[0].nodes[nodeIdx].data.autoTransitionTo = ids[i + 1];
  }
  const code = gen(p, 'p02');
  syntax(code, 'p02');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('P03', 'два узла указывают на один target → оба handle_callback одинаковые', () => {
  const p = clone(BASE);
  const sharedTarget = 'shared_target_p03';
  p.sheets[0].nodes.push(addMsgNode(sharedTarget));
  p.sheets[0].nodes.push(addMsgNode('node_p03_a', { enableAutoTransition: true, autoTransitionTo: sharedTarget }));
  p.sheets[0].nodes.push(addMsgNode('node_p03_b', { enableAutoTransition: true, autoTransitionTo: sharedTarget }));
  const code = gen(p, 'p03');
  syntax(code, 'p03');
  const count = (code.match(new RegExp(`handle_callback_${sharedTarget}`, 'g')) || []).length;
  ok(count >= 2, `handle_callback_${sharedTarget} должен встречаться минимум 2 раза, найдено: ${count}`);
});

test('P04', 'command + start + message все с автопереходом → синтаксис OK', () => {
  const p = clone(BASE);
  const targetId = 'shared_target_p04';
  p.sheets[0].nodes.push(addMsgNode(targetId));
  p.sheets[0].nodes.push(addCmdNode('cmd_p04', '/test', { enableAutoTransition: true, autoTransitionTo: targetId }));
  Object.assign(p.sheets[0].nodes[0].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  Object.assign(p.sheets[0].nodes[1].data, { enableAutoTransition: true, autoTransitionTo: targetId });
  const code = gen(p, 'p04');
  syntax(code, 'p04');
  const count = (code.match(/АВТОПЕРЕХОД/g) || []).length;
  ok(count >= 3, `должно быть минимум 3 АВТОПЕРЕХОД, найдено: ${count}`);
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${results.length} пройдено, ${failed} провалено`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
