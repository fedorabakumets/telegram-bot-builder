/**
 * @fileoverview Фаза 7 — Доступ (isPrivateOnly, adminOnly, requiresAuth)
 *
 * Блок A: isPrivateOnly
 * Блок B: adminOnly
 * Блок C: requiresAuth
 * Блок D: Комбинации флагов
 * Блок E: Граничные случаи
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

/** Добавляет command-узел */
function addCmdNode(id: string, command: string, data: Record<string, unknown> = {}) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({
    id,
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command,
      messageText: `Команда ${command}`,
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
      attachedMedia: [],
      isPrivateOnly: false,
      adminOnly: false,
      requiresAuth: false,
      ...data,
    },
  });
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase7_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase7DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p7_${label}.py`;
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
console.log('║         Фаза 7 — Доступ (isPrivateOnly, adminOnly, requiresAuth) ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: isPrivateOnly
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: isPrivateOnly ─────────────────────────────────────────');

test('A01', 'start: isPrivateOnly:true → is_private_chat в коде', () => {
  const code = gen(patchStart({ isPrivateOnly: true }), 'a01');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть в коде');
});

test('A02', 'message: isPrivateOnly:true → is_private_chat в коде', () => {
  const code = gen(patchMsg({ isPrivateOnly: true }), 'a02');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть в коде');
});

test('A03', 'start: isPrivateOnly:false → нет is_private_chat', () => {
  const code = gen(patchStart({ isPrivateOnly: false }), 'a03');
  ok(!code.includes('is_private_chat'), 'is_private_chat не должен быть при false');
});

test('A04', 'start: isPrivateOnly:true → синтаксис OK', () => {
  const code = gen(patchStart({ isPrivateOnly: true }), 'a04');
  syntax(code, 'a04');
});

test('A05', 'command: isPrivateOnly:true → is_private_chat в коде', () => {
  const p = addCmdNode('cmd_a05', '/test', { isPrivateOnly: true });
  const code = gen(p, 'a05');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть в command-узле');
});

test('A06', 'несколько узлов с isPrivateOnly:true → синтаксис OK', () => {
  const p = clone(BASE);
  p.sheets[0].nodes[0].data.isPrivateOnly = true;
  p.sheets[0].nodes[1].data.isPrivateOnly = true;
  p.sheets[0].nodes.push({
    id: 'cmd_a06',
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command: '/extra',
      messageText: 'Extra',
      keyboardType: 'none',
      buttons: [],
      formatMode: 'none',
      attachedMedia: [],
      isPrivateOnly: true,
      adminOnly: false,
      requiresAuth: false,
    },
  });
  const code = gen(p, 'a06');
  syntax(code, 'a06');
  const count = (code.match(/is_private_chat/g) || []).length;
  ok(count >= 3, `is_private_chat должен встречаться минимум 3 раза, найдено: ${count}`);
});

test('A07', 'message: isPrivateOnly:false → нет is_private_chat', () => {
  const code = gen(patchMsg({ isPrivateOnly: false }), 'a07');
  ok(!code.includes('is_private_chat'), 'is_private_chat не должен быть при false');
});

test('A08', 'start: isPrivateOnly:true → сообщение об ошибке в коде', () => {
  const code = gen(patchStart({ isPrivateOnly: true }), 'a08');
  ok(code.includes('приватных чатах') || code.includes('private'), 'сообщение об ошибке должно быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: adminOnly
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: adminOnly ─────────────────────────────────────────────');

test('B01', 'start: adminOnly:true → is_admin в коде', () => {
  const code = gen(patchStart({ adminOnly: true }), 'b01');
  ok(code.includes('is_admin'), 'is_admin должен быть в коде');
});

test('B02', 'message: adminOnly:true → is_admin в коде', () => {
  const code = gen(patchMsg({ adminOnly: true }), 'b02');
  ok(code.includes('is_admin'), 'is_admin должен быть в коде');
});

test('B03', 'start: adminOnly:false → нет is_admin', () => {
  const code = gen(patchStart({ adminOnly: false }), 'b03');
  ok(!code.includes('is_admin'), 'is_admin не должен быть при false');
});

test('B04', 'start: adminOnly:true → синтаксис OK', () => {
  const code = gen(patchStart({ adminOnly: true }), 'b04');
  syntax(code, 'b04');
});

test('B05', 'command: adminOnly:true → is_admin в коде', () => {
  const p = addCmdNode('cmd_b05', '/admin', { adminOnly: true });
  const code = gen(p, 'b05');
  ok(code.includes('is_admin'), 'is_admin должен быть в command-узле');
});

test('B06', 'message: adminOnly:false → нет is_admin', () => {
  const code = gen(patchMsg({ adminOnly: false }), 'b06');
  ok(!code.includes('is_admin'), 'is_admin не должен быть при false');
});

test('B07', 'start: adminOnly:true → сообщение об ошибке в коде', () => {
  const code = gen(patchStart({ adminOnly: true }), 'b07');
  ok(code.includes('прав') || code.includes('admin'), 'сообщение об ошибке должно быть');
});

test('B08', 'message: adminOnly:true → синтаксис OK', () => {
  const code = gen(patchMsg({ adminOnly: true }), 'b08');
  syntax(code, 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: requiresAuth
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: requiresAuth ──────────────────────────────────────────');

test('C01', 'start: requiresAuth:true → await check_auth в коде', () => {
  const code = gen(patchStart({ requiresAuth: true }), 'c01');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть в коде');
});

test('C02', 'message: requiresAuth:true → await check_auth в коде', () => {
  const code = gen(patchMsg({ requiresAuth: true }), 'c02');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть в коде');
});

test('C03', 'start: requiresAuth:false → нет вызова await check_auth', () => {
  const code = gen(patchStart({ requiresAuth: false }), 'c03');
  ok(!code.includes('await check_auth('), 'await check_auth( не должен быть при false');
});

test('C04', 'start: requiresAuth:true → синтаксис OK', () => {
  const code = gen(patchStart({ requiresAuth: true }), 'c04');
  syntax(code, 'c04');
});

test('C05', 'message: requiresAuth:false → нет вызова await check_auth', () => {
  const code = gen(patchMsg({ requiresAuth: false }), 'c05');
  ok(!code.includes('await check_auth('), 'await check_auth( не должен быть при false');
});

test('C06', 'command: requiresAuth:true → await check_auth в коде', () => {
  const p = addCmdNode('cmd_c06', '/profile', { requiresAuth: true });
  const code = gen(p, 'c06');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть в command-узле');
});

test('C07', 'message: requiresAuth:true → синтаксис OK', () => {
  const code = gen(patchMsg({ requiresAuth: true }), 'c07');
  syntax(code, 'c07');
});

test('C08', 'start: requiresAuth:true → сообщение об ошибке содержит /start', () => {
  const code = gen(patchStart({ requiresAuth: true }), 'c08');
  ok(code.includes('/start') || code.includes('запустите'), 'сообщение об ошибке должно содержать /start');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Комбинации флагов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Комбинации флагов ─────────────────────────────────────');

test('D01', 'start: isPrivateOnly:true + adminOnly:true → обе проверки + синтаксис OK', () => {
  const code = gen(patchStart({ isPrivateOnly: true, adminOnly: true }), 'd01');
  syntax(code, 'd01');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
});

test('D02', 'start: isPrivateOnly:true + requiresAuth:true → обе проверки + синтаксис OK', () => {
  const code = gen(patchStart({ isPrivateOnly: true, requiresAuth: true }), 'd02');
  syntax(code, 'd02');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('D03', 'start: adminOnly:true + requiresAuth:true → обе проверки + синтаксис OK', () => {
  const code = gen(patchStart({ adminOnly: true, requiresAuth: true }), 'd03');
  syntax(code, 'd03');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('D04', 'start: все три флага true → все три проверки + синтаксис OK', () => {
  const code = gen(patchStart({ isPrivateOnly: true, adminOnly: true, requiresAuth: true }), 'd04');
  syntax(code, 'd04');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('D05', 'start: все три флага true + userDatabaseEnabled:true → синтаксис OK', () => {
  const p = patchStart({ isPrivateOnly: true, adminOnly: true, requiresAuth: true });
  const code = genDB(p, 'd05');
  syntax(code, 'd05');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('D06', 'message: isPrivateOnly:true + adminOnly:true → обе проверки + синтаксис OK', () => {
  const code = gen(patchMsg({ isPrivateOnly: true, adminOnly: true }), 'd06');
  syntax(code, 'd06');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
});

test('D07', 'message: все три флага true → все три проверки + синтаксис OK', () => {
  const code = gen(patchMsg({ isPrivateOnly: true, adminOnly: true, requiresAuth: true }), 'd07');
  syntax(code, 'd07');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('D08', 'command: все три флага true → все три проверки + синтаксис OK', () => {
  const p = addCmdNode('cmd_d08', '/secure', { isPrivateOnly: true, adminOnly: true, requiresAuth: true });
  const code = gen(p, 'd08');
  syntax(code, 'd08');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Граничные случаи ──────────────────────────────────────');

test('E01', 'message: isPrivateOnly:true + кнопки → синтаксис OK', () => {
  const code = gen(patchMsg({
    isPrivateOnly: true,
    keyboardType: 'inline',
    buttons: [
      { id: 'b1', text: 'Кнопка 1', action: 'goto', target: 'some_node', hideAfterClick: false, skipDataCollection: false },
    ],
  }), 'e01');
  syntax(code, 'e01');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
});

test('E02', 'message: adminOnly:true + медиа → синтаксис OK', () => {
  const code = gen(patchMsg({
    adminOnly: true,
    imageUrl: 'https://example.com/photo.jpg',
    attachedMedia: [],
  }), 'e02');
  syntax(code, 'e02');
  ok(code.includes('is_admin'), 'is_admin должен быть');
});

test('E03', 'message: requiresAuth:true + collectUserInput → синтаксис OK', () => {
  const code = gen(patchMsg({
    requiresAuth: true,
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'user_answer',
    inputTargetNodeId: BASE.sheets[0].nodes[0].id,
  }), 'e03');
  syntax(code, 'e03');
  ok(code.includes('check_auth'), 'check_auth должен быть');
});

test('E04', 'все флаги false → синтаксис OK', () => {
  const code = gen(patchStart({ isPrivateOnly: false, adminOnly: false, requiresAuth: false }), 'e04');
  syntax(code, 'e04');
  ok(!code.includes('is_private_chat'), 'is_private_chat не должен быть');
  ok(!code.includes('is_admin'), 'is_admin не должен быть');
  ok(!code.includes('await check_auth('), 'await check_auth( не должен быть');
});

test('E05', 'start: isPrivateOnly:true + reply клавиатура → синтаксис OK', () => {
  const code = gen(patchStart({
    isPrivateOnly: true,
    keyboardType: 'reply',
    buttons: [
      { id: 'b1', text: 'Ответ', action: 'goto', target: 'some_node', hideAfterClick: false, skipDataCollection: false },
    ],
  }), 'e05');
  syntax(code, 'e05');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
});

test('E06', 'start: adminOnly:true + formatMode=html → синтаксис OK', () => {
  const code = gen(patchStart({
    adminOnly: true,
    formatMode: 'html',
    messageText: '<b>Только для админов</b>',
    attachedMedia: [],
  }), 'e06');
  syntax(code, 'e06');
  ok(code.includes('is_admin'), 'is_admin должен быть');
});

test('E07', 'start: requiresAuth:true + formatMode=markdown → синтаксис OK', () => {
  const code = gen(patchStart({
    requiresAuth: true,
    formatMode: 'markdown',
    messageText: '**Требуется авторизация**',
    attachedMedia: [],
  }), 'e07');
  syntax(code, 'e07');
  ok(code.includes('check_auth'), 'check_auth должен быть');
});

test('E08', 'message: все три флага true + userDatabaseEnabled:true → синтаксис OK', () => {
  const code = genDB(patchMsg({ isPrivateOnly: true, adminOnly: true, requiresAuth: true }), 'e08');
  syntax(code, 'e08');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

test('E09', 'start: isPrivateOnly:true + enableAutoTransition → синтаксис OK', () => {
  const targetId = BASE.sheets[0].nodes[1].id;
  const code = gen(patchStart({
    isPrivateOnly: true,
    enableAutoTransition: true,
    autoTransitionTo: targetId,
    attachedMedia: [],
  }), 'e09');
  syntax(code, 'e09');
  ok(code.includes('is_private_chat'), 'is_private_chat должен быть');
  ok(code.includes('АВТОПЕРЕХОД'), 'АВТОПЕРЕХОД должен быть');
});

test('E10', 'command: adminOnly:true + requiresAuth:true + userDatabaseEnabled:true → синтаксис OK', () => {
  const p = addCmdNode('cmd_e10', '/vip', { adminOnly: true, requiresAuth: true });
  const code = genDB(p, 'e10');
  syntax(code, 'e10');
  ok(code.includes('is_admin'), 'is_admin должен быть');
  ok(code.includes('await check_auth('), 'await check_auth( должен быть');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════════');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Итого: ${results.length} тестов | ✅ ${passed} прошло | ❌ ${failed} упало`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 Все тесты прошли успешно!');
}
