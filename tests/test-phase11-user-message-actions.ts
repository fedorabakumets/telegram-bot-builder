/**
 * @fileoverview Фаза 11 — Действия с пользователями и сообщениями
 *
 * Блок A: ban_user
 * Блок B: unban_user
 * Блок C: kick_user
 * Блок D: mute_user
 * Блок E: unmute_user
 * Блок F: promote_user
 * Блок G: demote_user
 * Блок H: pin_message
 * Блок I: unpin_message
 * Блок J: delete_message
 * Блок K: contact узел
 * Блок L: location узел
 * Блок M: Комбинации
 * Блок N: Граничные случаи
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../lib/bot-generator.ts';

// ─── Константы ───────────────────────────────────────────────────────────────

const PROJECT_PATH = 'bots/импортированный_проект_1723_60_53/project.json';
const BASE = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf-8'));

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

/** Добавляет новый узел в первый лист проекта */
function addNode(type: string, id: string, data: Record<string, unknown>) {
  const p = clone(BASE);
  p.sheets[0].nodes.push({ id, type, position: { x: 0, y: 0 }, data });
  return p;
}

/** Добавляет несколько узлов в первый лист проекта */
function addNodes(nodes: Array<{ type: string; id: string; data: Record<string, unknown> }>) {
  const p = clone(BASE);
  for (const n of nodes) {
    p.sheets[0].nodes.push({ id: n.id, type: n.type, position: { x: 0, y: 0 }, data: n.data });
  }
  return p;
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase11_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `Phase11DB_${label}`,
    userDatabaseEnabled: true,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p11_${label}.py`;
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
console.log('║   Фаза 11 — Действия с пользователями и сообщениями         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: ban_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: ban_user ──────────────────────────────────────────────');

test('A01', 'ban_user: базовый → ban_chat_member в коде, синтаксис OK', () => {
  const code = gen(addNode('ban_user', 'ban_node_a01', {}), 'a01');
  syntax(code, 'a01');
  ok(code.includes('ban_chat_member'), 'ban_chat_member должен быть в коде');
});

test('A02', 'ban_user: reason="Спам" → причина в коде', () => {
  const code = gen(addNode('ban_user', 'ban_node_a02', { reason: 'Спам' }), 'a02');
  syntax(code, 'a02');
  ok(code.includes('Спам'), 'причина Спам должна быть в коде');
});

test('A03', 'ban_user: reason не задан → дефолтная причина "Нарушение правил группы"', () => {
  const code = gen(addNode('ban_user', 'ban_node_a03', {}), 'a03');
  syntax(code, 'a03');
  ok(code.includes('Нарушение правил группы'), 'дефолтная причина должна быть в коде');
});

test('A04', 'ban_user: untilDate=0 → бан навсегда (заблокирован навсегда)', () => {
  const code = gen(addNode('ban_user', 'ban_node_a04', { untilDate: 0 }), 'a04');
  syntax(code, 'a04');
  ok(code.includes('заблокирован навсегда'), 'текст "заблокирован навсегда" должен быть в коде');
});

test('A05', 'ban_user: untilDate=1735689600 → временный бан (число в коде)', () => {
  const code = gen(addNode('ban_user', 'ban_node_a05', { untilDate: 1735689600 }), 'a05');
  syntax(code, 'a05');
  ok(code.includes('1735689600'), 'timestamp 1735689600 должен быть в коде');
});

test('A06', 'ban_user: synonyms=["бан","блок"] → синонимы в обработчике', () => {
  const code = gen(addNode('ban_user', 'ban_node_a06', { synonyms: ['бан', 'блок'] }), 'a06');
  syntax(code, 'a06');
  ok(code.includes('бан'), 'синоним "бан" должен быть в коде');
  ok(code.includes('блок'), 'синоним "блок" должен быть в коде');
});

test('A07', 'ban_user: synonyms=[] → дефолтные синонимы (забанить)', () => {
  const code = gen(addNode('ban_user', 'ban_node_a07', { synonyms: [] }), 'a07');
  syntax(code, 'a07');
  ok(code.includes('забанить'), 'дефолтный синоним "забанить" должен быть в коде');
});

test('A08', 'ban_user: targetGroupId="-1001234567890" → ID группы в условии', () => {
  const code = gen(addNode('ban_user', 'ban_node_a08', { targetGroupId: '-1001234567890' }), 'a08');
  syntax(code, 'a08');
  ok(code.includes('-1001234567890'), 'ID группы должен быть в коде');
});

test('A09', 'ban_user: targetGroupId="" → условие message.chat.type in [group, supergroup]', () => {
  const code = gen(addNode('ban_user', 'ban_node_a09', { targetGroupId: '' }), 'a09');
  syntax(code, 'a09');
  ok(code.includes("message.chat.type in ['group', 'supergroup']"), 'условие по типу чата должно быть');
});

test('A10', 'ban_user: nodeId с дефисами → safe_name применяется, синтаксис OK', () => {
  const code = gen(addNode('ban_user', 'ban-node-1', {}), 'a10');
  syntax(code, 'a10');
  ok(code.includes('ban_node_1'), 'safe_name должен заменить дефисы на подчёркивания');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: unban_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: unban_user ────────────────────────────────────────────');

test('B01', 'unban_user: базовый → unban_chat_member в коде, синтаксис OK', () => {
  const code = gen(addNode('unban_user', 'unban_node_b01', {}), 'b01');
  syntax(code, 'b01');
  ok(code.includes('unban_chat_member'), 'unban_chat_member должен быть в коде');
});

test('B02', 'unban_user: only_if_banned=True в коде', () => {
  const code = gen(addNode('unban_user', 'unban_node_b02', {}), 'b02');
  syntax(code, 'b02');
  ok(code.includes('only_if_banned=True'), 'only_if_banned=True должен быть в коде');
});

test('B03', 'unban_user: synonyms=["разбан"] → синоним в обработчике', () => {
  const code = gen(addNode('unban_user', 'unban_node_b03', { synonyms: ['разбан'] }), 'b03');
  syntax(code, 'b03');
  ok(code.includes('разбан'), 'синоним "разбан" должен быть в коде');
});

test('B04', 'unban_user: synonyms=[] → дефолтные синонимы (разбанить)', () => {
  const code = gen(addNode('unban_user', 'unban_node_b04', { synonyms: [] }), 'b04');
  syntax(code, 'b04');
  ok(code.includes('разбанить'), 'дефолтный синоним "разбанить" должен быть в коде');
});

test('B05', 'unban_user: targetGroupId задан → ID группы в коде', () => {
  const code = gen(addNode('unban_user', 'unban_node_b05', { targetGroupId: '-1009876543210' }), 'b05');
  syntax(code, 'b05');
  ok(code.includes('-1009876543210'), 'ID группы должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: kick_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: kick_user ─────────────────────────────────────────────');

test('C01', 'kick_user: базовый → ban_chat_member + unban_chat_member, синтаксис OK', () => {
  const code = gen(addNode('kick_user', 'kick_node_c01', {}), 'c01');
  syntax(code, 'c01');
  ok(code.includes('ban_chat_member'), 'ban_chat_member должен быть в коде (кик = бан+разбан)');
  ok(code.includes('unban_chat_member'), 'unban_chat_member должен быть в коде');
});

test('C02', 'kick_user: reason="Флуд" → причина в коде', () => {
  const code = gen(addNode('kick_user', 'kick_node_c02', { reason: 'Флуд' }), 'c02');
  syntax(code, 'c02');
  ok(code.includes('Флуд'), 'причина "Флуд" должна быть в коде');
});

test('C03', 'kick_user: reason не задан → дефолтная причина', () => {
  const code = gen(addNode('kick_user', 'kick_node_c03', {}), 'c03');
  syntax(code, 'c03');
  ok(code.includes('Нарушение правил группы'), 'дефолтная причина должна быть в коде');
});

test('C04', 'kick_user: synonyms=["кик","выгнать"] → синонимы в обработчике', () => {
  const code = gen(addNode('kick_user', 'kick_node_c04', { synonyms: ['кик', 'выгнать'] }), 'c04');
  syntax(code, 'c04');
  ok(code.includes('кик'), 'синоним "кик" должен быть в коде');
  ok(code.includes('выгнать'), 'синоним "выгнать" должен быть в коде');
});

test('C05', 'kick_user: revoke_messages=False в коде', () => {
  const code = gen(addNode('kick_user', 'kick_node_c05', {}), 'c05');
  syntax(code, 'c05');
  ok(code.includes('revoke_messages=False'), 'revoke_messages=False должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: mute_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: mute_user ─────────────────────────────────────────────');

test('D01', 'mute_user: базовый → restrict_chat_member в коде, синтаксис OK', () => {
  const code = gen(addNode('mute_user', 'mute_node_d01', {}), 'd01');
  syntax(code, 'd01');
  ok(code.includes('restrict_chat_member'), 'restrict_chat_member должен быть в коде');
});

test('D02', 'mute_user: duration=3600 → 3600 в коде', () => {
  const code = gen(addNode('mute_user', 'mute_node_d02', { duration: 3600 }), 'd02');
  syntax(code, 'd02');
  ok(code.includes('3600'), '3600 должен быть в коде');
});

test('D03', 'mute_user: duration=86400 → 86400 в коде (24 часа)', () => {
  const code = gen(addNode('mute_user', 'mute_node_d03', { duration: 86400 }), 'd03');
  syntax(code, 'd03');
  ok(code.includes('86400'), '86400 должен быть в коде');
});

test('D04', 'mute_user: duration не задан → дефолт 3600', () => {
  const code = gen(addNode('mute_user', 'mute_node_d04', {}), 'd04');
  syntax(code, 'd04');
  ok(code.includes('3600'), 'дефолтный duration 3600 должен быть в коде');
});

test('D05', 'mute_user: reason="Оффтоп" → причина в коде', () => {
  const code = gen(addNode('mute_user', 'mute_node_d05', { reason: 'Оффтоп' }), 'd05');
  syntax(code, 'd05');
  ok(code.includes('Оффтоп'), 'причина "Оффтоп" должна быть в коде');
});

test('D06', 'mute_user: все canSend*=false → все False в ChatPermissions', () => {
  const code = gen(addNode('mute_user', 'mute_node_d06', {
    canSendMessages: false,
    canSendMediaMessages: false,
    canSendPolls: false,
    canSendOtherMessages: false,
    canAddWebPagePreviews: false,
    canChangeGroupInfo: false,
    canInviteUsers2: false,
    canPinMessages2: false,
  }), 'd06');
  syntax(code, 'd06');
  ok(code.includes('can_send_messages=False'), 'can_send_messages=False должен быть');
  ok(code.includes('can_send_media_messages=False'), 'can_send_media_messages=False должен быть');
});

test('D07', 'mute_user: canSendMessages=true → can_send_messages=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d07', { canSendMessages: true }), 'd07');
  syntax(code, 'd07');
  ok(code.includes('can_send_messages=True'), 'can_send_messages=True должен быть');
});

test('D08', 'mute_user: canSendMediaMessages=true → can_send_media_messages=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d08', { canSendMediaMessages: true }), 'd08');
  syntax(code, 'd08');
  ok(code.includes('can_send_media_messages=True'), 'can_send_media_messages=True должен быть');
});

test('D09', 'mute_user: canSendPolls=true → can_send_polls=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d09', { canSendPolls: true }), 'd09');
  syntax(code, 'd09');
  ok(code.includes('can_send_polls=True'), 'can_send_polls=True должен быть');
});

test('D10', 'mute_user: canSendOtherMessages=true → can_send_other_messages=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d10', { canSendOtherMessages: true }), 'd10');
  syntax(code, 'd10');
  ok(code.includes('can_send_other_messages=True'), 'can_send_other_messages=True должен быть');
});

test('D11', 'mute_user: canAddWebPagePreviews=true → can_add_web_page_previews=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d11', { canAddWebPagePreviews: true }), 'd11');
  syntax(code, 'd11');
  ok(code.includes('can_add_web_page_previews=True'), 'can_add_web_page_previews=True должен быть');
});

test('D12', 'mute_user: canChangeGroupInfo=true → can_change_info=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d12', { canChangeGroupInfo: true }), 'd12');
  syntax(code, 'd12');
  ok(code.includes('can_change_info=True'), 'can_change_info=True должен быть');
});

test('D13', 'mute_user: canInviteUsers2=true → can_invite_users=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d13', { canInviteUsers2: true }), 'd13');
  syntax(code, 'd13');
  ok(code.includes('can_invite_users=True'), 'can_invite_users=True должен быть');
});

test('D14', 'mute_user: canPinMessages2=true → can_pin_messages=True', () => {
  const code = gen(addNode('mute_user', 'mute_node_d14', { canPinMessages2: true }), 'd14');
  syntax(code, 'd14');
  ok(code.includes('can_pin_messages=True'), 'can_pin_messages=True должен быть');
});

test('D15', 'mute_user: все canSend*=true → все True в ChatPermissions, синтаксис OK', () => {
  const code = gen(addNode('mute_user', 'mute_node_d15', {
    canSendMessages: true,
    canSendMediaMessages: true,
    canSendPolls: true,
    canSendOtherMessages: true,
    canAddWebPagePreviews: true,
    canChangeGroupInfo: true,
    canInviteUsers2: true,
    canPinMessages2: true,
  }), 'd15');
  syntax(code, 'd15');
  ok(code.includes('can_send_messages=True'), 'can_send_messages=True должен быть');
  ok(code.includes('can_send_media_messages=True'), 'can_send_media_messages=True должен быть');
  ok(code.includes('can_send_polls=True'), 'can_send_polls=True должен быть');
  ok(code.includes('can_send_other_messages=True'), 'can_send_other_messages=True должен быть');
  ok(code.includes('can_add_web_page_previews=True'), 'can_add_web_page_previews=True должен быть');
  ok(code.includes('can_change_info=True'), 'can_change_info=True должен быть');
  ok(code.includes('can_invite_users=True'), 'can_invite_users=True должен быть');
  ok(code.includes('can_pin_messages=True'), 'can_pin_messages=True должен быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: unmute_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: unmute_user ───────────────────────────────────────────');

test('E01', 'unmute_user: базовый → restrict_chat_member с can_send_messages=True, синтаксис OK', () => {
  const code = gen(addNode('unmute_user', 'unmute_node_e01', {}), 'e01');
  syntax(code, 'e01');
  ok(code.includes('restrict_chat_member'), 'restrict_chat_member должен быть в коде');
  ok(code.includes('can_send_messages=True'), 'can_send_messages=True должен быть');
});

test('E02', 'unmute_user: все права восстановлены → can_send_messages=True, can_send_media_messages=True и т.д.', () => {
  const code = gen(addNode('unmute_user', 'unmute_node_e02', {}), 'e02');
  syntax(code, 'e02');
  ok(code.includes('can_send_messages=True'), 'can_send_messages=True должен быть');
  ok(code.includes('can_send_media_messages=True'), 'can_send_media_messages=True должен быть');
  ok(code.includes('can_send_polls=True'), 'can_send_polls=True должен быть');
  ok(code.includes('can_send_other_messages=True'), 'can_send_other_messages=True должен быть');
  ok(code.includes('can_add_web_page_previews=True'), 'can_add_web_page_previews=True должен быть');
});

test('E03', 'unmute_user: synonyms=["размут"] → синоним в обработчике', () => {
  const code = gen(addNode('unmute_user', 'unmute_node_e03', { synonyms: ['размут'] }), 'e03');
  syntax(code, 'e03');
  ok(code.includes('размут'), 'синоним "размут" должен быть в коде');
});

test('E04', 'unmute_user: synonyms=[] → дефолтные синонимы (размутить)', () => {
  const code = gen(addNode('unmute_user', 'unmute_node_e04', { synonyms: [] }), 'e04');
  syntax(code, 'e04');
  ok(code.includes('размутить'), 'дефолтный синоним "размутить" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: promote_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: promote_user ──────────────────────────────────────────');

test('F01', 'promote_user: базовый → promote_chat_member в коде, синтаксис OK', () => {
  const code = gen(addNode('promote_user', 'promote_node_f01', {}), 'f01');
  syntax(code, 'f01');
  ok(code.includes('promote_chat_member'), 'promote_chat_member должен быть в коде');
});

test('F02', 'promote_user: canChangeInfo=true → can_change_info=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f02', { canChangeInfo: true }), 'f02');
  syntax(code, 'f02');
  ok(code.includes('can_change_info=True'), 'can_change_info=True должен быть');
});

test('F03', 'promote_user: canDeleteMessages=true → can_delete_messages=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f03', { canDeleteMessages: true }), 'f03');
  syntax(code, 'f03');
  ok(code.includes('can_delete_messages=True'), 'can_delete_messages=True должен быть');
});

test('F04', 'promote_user: canInviteUsers=true → can_invite_users=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f04', { canInviteUsers: true }), 'f04');
  syntax(code, 'f04');
  ok(code.includes('can_invite_users=True'), 'can_invite_users=True должен быть');
});

test('F05', 'promote_user: canRestrictMembers=true → can_restrict_members=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f05', { canRestrictMembers: true }), 'f05');
  syntax(code, 'f05');
  ok(code.includes('can_restrict_members=True'), 'can_restrict_members=True должен быть');
});

test('F06', 'promote_user: canPinMessages=true → can_pin_messages=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f06', { canPinMessages: true }), 'f06');
  syntax(code, 'f06');
  ok(code.includes('can_pin_messages=True'), 'can_pin_messages=True должен быть');
});

test('F07', 'promote_user: canPromoteMembers=true → can_promote_members=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f07', { canPromoteMembers: true }), 'f07');
  syntax(code, 'f07');
  ok(code.includes('can_promote_members=True'), 'can_promote_members=True должен быть');
});

test('F08', 'promote_user: canManageVideoChats=true → can_manage_video_chats=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f08', { canManageVideoChats: true }), 'f08');
  syntax(code, 'f08');
  ok(code.includes('can_manage_video_chats=True'), 'can_manage_video_chats=True должен быть');
});

test('F09', 'promote_user: canManageTopics=true → can_manage_topics=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f09', { canManageTopics: true }), 'f09');
  syntax(code, 'f09');
  ok(code.includes('can_manage_topics=True'), 'can_manage_topics=True должен быть');
});

test('F10', 'promote_user: isAnonymous=true → is_anonymous=True', () => {
  const code = gen(addNode('promote_user', 'promote_node_f10', { isAnonymous: true }), 'f10');
  syntax(code, 'f10');
  ok(code.includes('is_anonymous=True'), 'is_anonymous=True должен быть');
});

test('F11', 'promote_user: все права false → все False, синтаксис OK', () => {
  const code = gen(addNode('promote_user', 'promote_node_f11', {
    canChangeInfo: false,
    canDeleteMessages: false,
    canInviteUsers: false,
    canRestrictMembers: false,
    canPinMessages: false,
    canPromoteMembers: false,
    canManageVideoChats: false,
    canManageTopics: false,
    isAnonymous: false,
  }), 'f11');
  syntax(code, 'f11');
  ok(code.includes('can_change_info=False'), 'can_change_info=False должен быть');
  ok(code.includes('is_anonymous=False'), 'is_anonymous=False должен быть');
});

test('F12', 'promote_user: все права true → все True, синтаксис OK', () => {
  const code = gen(addNode('promote_user', 'promote_node_f12', {
    canChangeInfo: true,
    canDeleteMessages: true,
    canInviteUsers: true,
    canRestrictMembers: true,
    canPinMessages: true,
    canPromoteMembers: true,
    canManageVideoChats: true,
    canManageTopics: true,
    isAnonymous: true,
  }), 'f12');
  syntax(code, 'f12');
  ok(code.includes('can_change_info=True'), 'can_change_info=True должен быть');
  ok(code.includes('can_promote_members=True'), 'can_promote_members=True должен быть');
  ok(code.includes('is_anonymous=True'), 'is_anonymous=True должен быть');
});

test('F13', 'promote_user: synonyms=[] → дефолтные синонимы (повысить)', () => {
  const code = gen(addNode('promote_user', 'promote_node_f13', { synonyms: [] }), 'f13');
  syntax(code, 'f13');
  ok(code.includes('повысить'), 'дефолтный синоним "повысить" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: demote_user
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: demote_user ───────────────────────────────────────────');

test('G01', 'demote_user: базовый → promote_chat_member с всеми False, синтаксис OK', () => {
  const code = gen(addNode('demote_user', 'demote_node_g01', {}), 'g01');
  syntax(code, 'g01');
  ok(code.includes('promote_chat_member'), 'promote_chat_member должен быть в коде');
  ok(code.includes('can_change_info=False'), 'can_change_info=False должен быть');
});

test('G02', 'demote_user: все права явно False в коде', () => {
  const code = gen(addNode('demote_user', 'demote_node_g02', {}), 'g02');
  syntax(code, 'g02');
  ok(code.includes('can_delete_messages=False'), 'can_delete_messages=False должен быть');
  ok(code.includes('can_invite_users=False'), 'can_invite_users=False должен быть');
  ok(code.includes('can_restrict_members=False'), 'can_restrict_members=False должен быть');
  ok(code.includes('can_pin_messages=False'), 'can_pin_messages=False должен быть');
  ok(code.includes('can_promote_members=False'), 'can_promote_members=False должен быть');
  ok(code.includes('can_manage_video_chats=False'), 'can_manage_video_chats=False должен быть');
  ok(code.includes('is_anonymous=False'), 'is_anonymous=False должен быть');
});

test('G03', 'demote_user: synonyms=["снять"] → синоним в обработчике', () => {
  const code = gen(addNode('demote_user', 'demote_node_g03', { synonyms: ['снять'] }), 'g03');
  syntax(code, 'g03');
  ok(code.includes('снять'), 'синоним "снять" должен быть в коде');
});

test('G04', 'demote_user: synonyms=[] → дефолтные синонимы (понизить)', () => {
  const code = gen(addNode('demote_user', 'demote_node_g04', { synonyms: [] }), 'g04');
  syntax(code, 'g04');
  ok(code.includes('понизить'), 'дефолтный синоним "понизить" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: pin_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: pin_message ───────────────────────────────────────────');

test('H01', 'pin_message: базовый → pin_chat_message в коде, синтаксис OK', () => {
  const code = gen(addNode('pin_message', 'pin_node_h01', {}), 'h01');
  syntax(code, 'h01');
  ok(code.includes('pin_chat_message'), 'pin_chat_message должен быть в коде');
});

test('H02', 'pin_message: disableNotification=true → disable_notification=True', () => {
  const code = gen(addNode('pin_message', 'pin_node_h02', { disableNotification: true }), 'h02');
  syntax(code, 'h02');
  ok(code.includes('disable_notification=True'), 'disable_notification=True должен быть');
});

test('H03', 'pin_message: disableNotification=false → disable_notification=False', () => {
  const code = gen(addNode('pin_message', 'pin_node_h03', { disableNotification: false }), 'h03');
  syntax(code, 'h03');
  ok(code.includes('disable_notification=False'), 'disable_notification=False должен быть');
});

test('H04', 'pin_message: messageText="Закреплено!" → текст в коде', () => {
  const code = gen(addNode('pin_message', 'pin_node_h04', { messageText: 'Закреплено!' }), 'h04');
  syntax(code, 'h04');
  ok(code.includes('Закреплено!'), 'текст "Закреплено!" должен быть в коде');
});

test('H05', 'pin_message: messageText не задан → дефолт "✅ Сообщение закреплено"', () => {
  const code = gen(addNode('pin_message', 'pin_node_h05', {}), 'h05');
  syntax(code, 'h05');
  ok(code.includes('✅ Сообщение закреплено'), 'дефолтный текст должен быть в коде');
});

test('H06', 'pin_message: synonyms=["закрепи","прикрепи"] → синонимы в обработчике', () => {
  const code = gen(addNode('pin_message', 'pin_node_h06', { synonyms: ['закрепи', 'прикрепи'] }), 'h06');
  syntax(code, 'h06');
  ok(code.includes('закрепи'), 'синоним "закрепи" должен быть в коде');
  ok(code.includes('прикрепи'), 'синоним "прикрепи" должен быть в коде');
});

test('H07', 'pin_message: synonyms=[] → дефолтные синонимы (закрепить)', () => {
  const code = gen(addNode('pin_message', 'pin_node_h07', { synonyms: [] }), 'h07');
  syntax(code, 'h07');
  ok(code.includes('закрепить'), 'дефолтный синоним "закрепить" должен быть в коде');
});

test('H08', 'pin_message: targetGroupId="-1001234567890" → ID группы в условии', () => {
  const code = gen(addNode('pin_message', 'pin_node_h08', { targetGroupId: '-1001234567890' }), 'h08');
  syntax(code, 'h08');
  ok(code.includes('-1001234567890'), 'ID группы должен быть в коде');
});

test('H09', 'pin_message: targetGroupId="" → условие по типу чата', () => {
  const code = gen(addNode('pin_message', 'pin_node_h09', { targetGroupId: '' }), 'h09');
  syntax(code, 'h09');
  ok(code.includes("message.chat.type in ['group', 'supergroup']"), 'условие по типу чата должно быть');
});

test('H10', 'pin_message: nodeId с дефисами → синтаксис OK', () => {
  const code = gen(addNode('pin_message', 'pin-message-node-1', {}), 'h10');
  syntax(code, 'h10');
  ok(code.includes('pin_message_node_1'), 'safe_name должен заменить дефисы');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: unpin_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: unpin_message ─────────────────────────────────────────');

test('I01', 'unpin_message: базовый → unpin_all_chat_messages или unpin_chat_message, синтаксис OK', () => {
  const code = gen(addNode('unpin_message', 'unpin_node_i01', {}), 'i01');
  syntax(code, 'i01');
  ok(
    code.includes('unpin_all_chat_messages') || code.includes('unpin_chat_message'),
    'unpin_all_chat_messages или unpin_chat_message должен быть в коде'
  );
});

test('I02', 'unpin_message: messageText="Откреплено!" → текст в коде', () => {
  const code = gen(addNode('unpin_message', 'unpin_node_i02', { messageText: 'Откреплено!' }), 'i02');
  syntax(code, 'i02');
  ok(code.includes('Откреплено!'), 'текст "Откреплено!" должен быть в коде');
});

test('I03', 'unpin_message: messageText не задан → дефолт "✅ Сообщение откреплено"', () => {
  const code = gen(addNode('unpin_message', 'unpin_node_i03', {}), 'i03');
  syntax(code, 'i03');
  ok(code.includes('✅ Сообщение откреплено'), 'дефолтный текст должен быть в коде');
});

test('I04', 'unpin_message: synonyms=["открепи"] → синоним в обработчике', () => {
  const code = gen(addNode('unpin_message', 'unpin_node_i04', { synonyms: ['открепи'] }), 'i04');
  syntax(code, 'i04');
  ok(code.includes('открепи'), 'синоним "открепи" должен быть в коде');
});

test('I05', 'unpin_message: synonyms=[] → дефолтные синонимы (открепить)', () => {
  const code = gen(addNode('unpin_message', 'unpin_node_i05', { synonyms: [] }), 'i05');
  syntax(code, 'i05');
  ok(code.includes('открепить'), 'дефолтный синоним "открепить" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: delete_message
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: delete_message ────────────────────────────────────────');

test('J01', 'delete_message: базовый → delete_message в коде, синтаксис OK', () => {
  const code = gen(addNode('delete_message', 'del_node_j01', {}), 'j01');
  syntax(code, 'j01');
  ok(code.includes('delete_message'), 'delete_message должен быть в коде');
});

test('J02', 'delete_message: messageText="Удалено!" → текст в коде', () => {
  const code = gen(addNode('delete_message', 'del_node_j02', { messageText: 'Удалено!' }), 'j02');
  syntax(code, 'j02');
  ok(code.includes('Удалено!'), 'текст "Удалено!" должен быть в коде');
});

test('J03', 'delete_message: messageText не задан → дефолт "🗑️ Сообщение успешно удалено!"', () => {
  const code = gen(addNode('delete_message', 'del_node_j03', {}), 'j03');
  syntax(code, 'j03');
  ok(code.includes('🗑️ Сообщение успешно удалено!'), 'дефолтный текст должен быть в коде');
});

test('J04', 'delete_message: synonyms=["удали","стёрт"] → синонимы в обработчике', () => {
  const code = gen(addNode('delete_message', 'del_node_j04', { synonyms: ['удали', 'стёрт'] }), 'j04');
  syntax(code, 'j04');
  ok(code.includes('удали'), 'синоним "удали" должен быть в коде');
  ok(code.includes('стёрт'), 'синоним "стёрт" должен быть в коде');
});

test('J05', 'delete_message: synonyms=[] → дефолтные синонимы (удалить)', () => {
  const code = gen(addNode('delete_message', 'del_node_j05', { synonyms: [] }), 'j05');
  syntax(code, 'j05');
  ok(code.includes('удалить'), 'дефолтный синоним "удалить" должен быть в коде');
});

test('J06', 'delete_message: nodeId с дефисами → синтаксис OK', () => {
  const code = gen(addNode('delete_message', 'delete-message-node-1', {}), 'j06');
  syntax(code, 'j06');
  ok(code.includes('delete_message_node_1'), 'safe_name должен заменить дефисы');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: contact узел
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: contact ───────────────────────────────────────────────');

test('K01', 'contact: базовый → answer_contact в коде, синтаксис OK', () => {
  const code = gen(addNode('contact', 'contact_node_k01', { command: '/contact' }), 'k01');
  syntax(code, 'k01');
  ok(code.includes('answer_contact'), 'answer_contact должен быть в коде');
});

test('K02', 'contact: phoneNumber="+79991234567" → номер в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k02', {
    command: '/contact',
    phoneNumber: '+79991234567',
  }), 'k02');
  syntax(code, 'k02');
  ok(code.includes('+79991234567'), 'номер телефона должен быть в коде');
});

test('K03', 'contact: firstName="Иван" → имя в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k03', {
    command: '/contact',
    firstName: 'Иван',
  }), 'k03');
  syntax(code, 'k03');
  ok(code.includes('Иван'), 'имя "Иван" должно быть в коде');
});

test('K04', 'contact: lastName="Иванов" → фамилия в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k04', {
    command: '/contact',
    firstName: 'Иван',
    lastName: 'Иванов',
  }), 'k04');
  syntax(code, 'k04');
  ok(code.includes('Иванов'), 'фамилия "Иванов" должна быть в коде');
  ok(code.includes('last_name'), 'last_name должен быть в коде');
});

test('K05', 'contact: lastName не задан → нет last_name в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k05', {
    command: '/contact',
    firstName: 'Иван',
    lastName: '',
  }), 'k05');
  syntax(code, 'k05');
  // Проверяем только в блоке обработчика контакта
  const startIdx = code.indexOf('# Обработчик контакта для узла contact_node_k05');
  const endIdx = code.indexOf('# @@NOD', startIdx + 1);
  const contactBlock = endIdx > 0 ? code.slice(startIdx, endIdx) : code.slice(startIdx);
  ok(!contactBlock.includes('last_name'), 'last_name не должен быть в блоке контакта при пустой фамилии');
});

test('K06', 'contact: userId=123456 → user_id в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k06', {
    command: '/contact',
    userId: 123456,
  }), 'k06');
  syntax(code, 'k06');
  ok(code.includes('123456'), 'userId 123456 должен быть в коде');
  ok(code.includes('user_id'), 'user_id должен быть в коде');
});

test('K07', 'contact: userId=0 → нет user_id в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k07', {
    command: '/contact',
    userId: 0,
  }), 'k07');
  syntax(code, 'k07');
  // Проверяем только в блоке обработчика контакта
  const startIdx = code.indexOf('# Обработчик контакта для узла contact_node_k07');
  const endIdx = code.indexOf('# @@NOD', startIdx + 1);
  const contactBlock = endIdx > 0 ? code.slice(startIdx, endIdx) : code.slice(startIdx);
  ok(!contactBlock.includes('user_id'), 'user_id не должен быть в блоке контакта при userId=0');
});

test('K08', 'contact: vcard="BEGIN:VCARD..." → vcard в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k08', {
    command: '/contact',
    vcard: 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD',
  }), 'k08');
  syntax(code, 'k08');
  ok(code.includes('vcard'), 'vcard должен быть в коде');
  ok(code.includes('BEGIN:VCARD'), 'содержимое vcard должно быть в коде');
});

test('K09', 'contact: vcard не задан → нет vcard в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k09', {
    command: '/contact',
    vcard: '',
  }), 'k09');
  syntax(code, 'k09');
  // Проверяем только в блоке обработчика контакта
  const startIdx = code.indexOf('# Обработчик контакта для узла contact_node_k09');
  const endIdx = code.indexOf('# @@NOD', startIdx + 1);
  const contactBlock = endIdx > 0 ? code.slice(startIdx, endIdx) : code.slice(startIdx);
  ok(!contactBlock.includes('vcard'), 'vcard не должен быть в блоке контакта при пустом значении');
});

test('K10', 'contact: command="/contact" → Command("contact") в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k10', { command: '/contact' }), 'k10');
  syntax(code, 'k10');
  ok(code.includes('Command("contact")'), 'Command("contact") должен быть в коде');
});

test('K11', 'contact: isPrivateOnly=true → is_private_chat проверка', () => {
  const code = gen(addNode('contact', 'contact_node_k11', {
    command: '/contact',
    isPrivateOnly: true,
  }), 'k11');
  syntax(code, 'k11');
  ok(code.includes('is_private_chat'), 'is_private_chat проверка должна быть в коде');
});

test('K12', 'contact: adminOnly=true → is_admin проверка', () => {
  const code = gen(addNode('contact', 'contact_node_k12', {
    command: '/contact',
    adminOnly: true,
  }), 'k12');
  syntax(code, 'k12');
  ok(code.includes('is_admin'), 'is_admin проверка должна быть в коде');
});

test('K13', 'contact: keyboardType="inline" + кнопки → InlineKeyboardBuilder в коде', () => {
  const code = gen(addNode('contact', 'contact_node_k13', {
    command: '/contact',
    keyboardType: 'inline',
    buttons: [{ id: '1', text: 'Кнопка', action: 'url', url: 'https://example.com' }],
  }), 'k13');
  syntax(code, 'k13');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть в коде');
});

test('K14', 'contact: phoneNumber со спецсимволами → синтаксис OK', () => {
  const code = gen(addNode('contact', 'contact_node_k14', {
    command: '/contact',
    phoneNumber: '+7 (999) 123-45-67',
  }), 'k14');
  syntax(code, 'k14');
  ok(code.includes('answer_contact'), 'answer_contact должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: location узел
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: location ──────────────────────────────────────────────');

test('L01', 'location: базовый → answer_location или answer_venue в коде, синтаксис OK', () => {
  const code = gen(addNode('location', 'loc_node_l01', { command: '/location' }), 'l01');
  syntax(code, 'l01');
  ok(
    code.includes('answer_location') || code.includes('answer_venue'),
    'answer_location или answer_venue должен быть в коде'
  );
});

test('L02', 'location: latitude=55.7558, longitude=37.6176 → координаты в коде', () => {
  const code = gen(addNode('location', 'loc_node_l02', {
    command: '/location',
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'l02');
  syntax(code, 'l02');
  ok(code.includes('55.7558'), 'latitude 55.7558 должен быть в коде');
  ok(code.includes('37.6176'), 'longitude 37.6176 должен быть в коде');
});

test('L03', 'location: title="Офис" + address="ул. Ленина 1" → answer_venue в коде', () => {
  const code = gen(addNode('location', 'loc_node_l03', {
    command: '/location',
    latitude: 55.7558,
    longitude: 37.6176,
    title: 'Офис',
    address: 'ул. Ленина 1',
  }), 'l03');
  syntax(code, 'l03');
  ok(code.includes('answer_venue'), 'answer_venue должен быть при title и address');
  ok(code.includes('Офис'), 'title "Офис" должен быть в коде');
  ok(code.includes('ул. Ленина 1'), 'address должен быть в коде');
});

test('L04', 'location: title не задан → answer_location (без venue)', () => {
  const code = gen(addNode('location', 'loc_node_l04', {
    command: '/location',
    latitude: 55.7558,
    longitude: 37.6176,
    title: '',
    address: '',
  }), 'l04');
  syntax(code, 'l04');
  ok(code.includes('answer_location'), 'answer_location должен быть без title');
});

test('L05', 'location: mapService="yandex" + yandexMapUrl → extract_coordinates_from_yandex в коде', () => {
  const code = gen(addNode('location', 'loc_node_l05', {
    command: '/location',
    mapService: 'yandex',
    yandexMapUrl: 'https://yandex.ru/maps/?ll=37.6176,55.7558',
  }), 'l05');
  syntax(code, 'l05');
  ok(code.includes('extract_coordinates_from_yandex'), 'extract_coordinates_from_yandex должен быть в коде');
  ok(code.includes('yandex.ru'), 'URL Яндекс должен быть в коде');
});

test('L06', 'location: mapService="google" + googleMapUrl → extract_coordinates_from_google', () => {
  const code = gen(addNode('location', 'loc_node_l06', {
    command: '/location',
    mapService: 'google',
    googleMapUrl: 'https://maps.google.com/?q=55.7558,37.6176',
  }), 'l06');
  syntax(code, 'l06');
  ok(code.includes('extract_coordinates_from_google'), 'extract_coordinates_from_google должен быть в коде');
});

test('L07', 'location: mapService="2gis" + gisMapUrl → extract_coordinates_from_2gis', () => {
  const code = gen(addNode('location', 'loc_node_l07', {
    command: '/location',
    mapService: '2gis',
    gisMapUrl: 'https://2gis.ru/moscow/geo/123456',
  }), 'l07');
  syntax(code, 'l07');
  ok(code.includes('extract_coordinates_from_2gis'), 'extract_coordinates_from_2gis должен быть в коде');
});

test('L08', 'location: mapService="custom" → прямые координаты без extract', () => {
  const code = gen(addNode('location', 'loc_node_l08', {
    command: '/location',
    mapService: 'custom',
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'l08');
  syntax(code, 'l08');
  ok(!code.includes('extract_coordinates_from_'), 'extract_coordinates не должен быть при custom');
  ok(code.includes('55.7558'), 'координаты должны быть напрямую');
});

test('L09', 'location: generateMapPreview=true → InlineKeyboardBuilder с картами в коде', () => {
  const code = gen(addNode('location', 'loc_node_l09', {
    command: '/location',
    generateMapPreview: true,
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'l09');
  syntax(code, 'l09');
  ok(code.includes('InlineKeyboardBuilder'), 'InlineKeyboardBuilder должен быть при generateMapPreview');
});

test('L10', 'location: generateMapPreview=false → нет карт-кнопок', () => {
  const code = gen(addNode('location', 'loc_node_l10', {
    command: '/location',
    generateMapPreview: false,
    latitude: 55.7558,
    longitude: 37.6176,
    title: '',
    address: '',
  }), 'l10');
  syntax(code, 'l10');
  // Проверяем только в блоке обработчика геолокации
  const startIdx = code.indexOf('# Обработчик геолокации для узла loc_node_l10');
  const endIdx = code.indexOf('# @@NOD', startIdx + 1);
  const locBlock = endIdx > 0 ? code.slice(startIdx, endIdx) : code.slice(startIdx);
  ok(!locBlock.includes('generate_map_urls'), 'generate_map_urls не должен быть в блоке при generateMapPreview=false');
});

test('L11', 'location: showDirections=true → кнопки маршрута в коде (Маршрут)', () => {
  const code = gen(addNode('location', 'loc_node_l11', {
    command: '/location',
    generateMapPreview: true,
    showDirections: true,
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'l11');
  syntax(code, 'l11');
  ok(code.includes('Маршрут'), 'кнопки маршрута должны быть в коде');
});

test('L12', 'location: showDirections=false → нет кнопок маршрута', () => {
  const code = gen(addNode('location', 'loc_node_l12', {
    command: '/location',
    generateMapPreview: true,
    showDirections: false,
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'l12');
  syntax(code, 'l12');
  ok(!code.includes('Маршрут (Яндекс)'), 'кнопки маршрута не должны быть при showDirections=false');
});

test('L13', 'location: foursquareId="abc123" → foursquare_id в коде', () => {
  const code = gen(addNode('location', 'loc_node_l13', {
    command: '/location',
    latitude: 55.7558,
    longitude: 37.6176,
    title: 'Место',
    address: 'Адрес',
    foursquareId: 'abc123',
  }), 'l13');
  syntax(code, 'l13');
  ok(code.includes('foursquare_id'), 'foursquare_id должен быть в коде');
  ok(code.includes('abc123'), 'значение foursquareId должно быть в коде');
});

test('L14', 'location: command="/location" → Command("location") в коде', () => {
  const code = gen(addNode('location', 'loc_node_l14', { command: '/location' }), 'l14');
  syntax(code, 'l14');
  ok(code.includes('Command("location")'), 'Command("location") должен быть в коде');
});

test('L15', 'location: isPrivateOnly=true → is_private_chat проверка', () => {
  const code = gen(addNode('location', 'loc_node_l15', {
    command: '/location',
    isPrivateOnly: true,
  }), 'l15');
  syntax(code, 'l15');
  ok(code.includes('is_private_chat'), 'is_private_chat проверка должна быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Комбинации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Комбинации ────────────────────────────────────────────');

test('M01', 'ban + unban + kick в одном проекте → все три обработчика, синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'ban_user',  id: 'ban_m01',  data: {} },
    { type: 'unban_user', id: 'unban_m01', data: {} },
    { type: 'kick_user', id: 'kick_m01', data: {} },
  ]), 'm01');
  syntax(code, 'm01');
  ok(code.includes('ban_chat_member'), 'ban_chat_member должен быть');
  ok(code.includes('unban_chat_member'), 'unban_chat_member должен быть');
  // kick тоже использует ban+unban
  const banCount = (code.match(/ban_chat_member/g) || []).length;
  ok(banCount >= 2, 'ban_chat_member должен встречаться минимум 2 раза (ban + kick)');
});

test('M02', 'mute + unmute в одном проекте → оба обработчика, синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'mute_user',   id: 'mute_m02',   data: {} },
    { type: 'unmute_user', id: 'unmute_m02', data: {} },
  ]), 'm02');
  syntax(code, 'm02');
  ok(code.includes('restrict_chat_member'), 'restrict_chat_member должен быть');
  ok(code.includes('замутить'), 'синоним мута должен быть');
  ok(code.includes('размутить'), 'синоним размута должен быть');
});

test('M03', 'promote + demote в одном проекте → оба обработчика, синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'promote_user', id: 'promote_m03', data: {} },
    { type: 'demote_user',  id: 'demote_m03',  data: {} },
  ]), 'm03');
  syntax(code, 'm03');
  ok(code.includes('promote_chat_member'), 'promote_chat_member должен быть');
  ok(code.includes('повысить'), 'синоним повышения должен быть');
  ok(code.includes('понизить'), 'синоним понижения должен быть');
});

test('M04', 'pin + unpin + delete в одном проекте → все три обработчика, синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'pin_message',    id: 'pin_m04',    data: {} },
    { type: 'unpin_message',  id: 'unpin_m04',  data: {} },
    { type: 'delete_message', id: 'delete_m04', data: {} },
  ]), 'm04');
  syntax(code, 'm04');
  ok(code.includes('pin_chat_message'), 'pin_chat_message должен быть');
  ok(code.includes('unpin'), 'unpin должен быть');
  ok(code.includes('delete_message'), 'delete_message должен быть');
});

test('M05', 'contact + location в одном проекте → оба обработчика, синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'contact',  id: 'contact_m05',  data: { command: '/contact' } },
    { type: 'location', id: 'location_m05', data: { command: '/location' } },
  ]), 'm05');
  syntax(code, 'm05');
  ok(code.includes('answer_contact'), 'answer_contact должен быть');
  ok(
    code.includes('answer_location') || code.includes('answer_venue'),
    'answer_location или answer_venue должен быть'
  );
});

test('M06', 'все типы узлов вместе → синтаксис OK', () => {
  const code = gen(addNodes([
    { type: 'ban_user',       id: 'ban_m06',       data: {} },
    { type: 'unban_user',     id: 'unban_m06',     data: {} },
    { type: 'kick_user',      id: 'kick_m06',      data: {} },
    { type: 'mute_user',      id: 'mute_m06',      data: {} },
    { type: 'unmute_user',    id: 'unmute_m06',    data: {} },
    { type: 'promote_user',   id: 'promote_m06',   data: {} },
    { type: 'demote_user',    id: 'demote_m06',    data: {} },
    { type: 'pin_message',    id: 'pin_m06',       data: {} },
    { type: 'unpin_message',  id: 'unpin_m06',     data: {} },
    { type: 'delete_message', id: 'delete_m06',    data: {} },
    { type: 'contact',        id: 'contact_m06',   data: { command: '/contact' } },
    { type: 'location',       id: 'location_m06',  data: { command: '/location' } },
  ]), 'm06');
  syntax(code, 'm06');
});

test('M07', 'ban_user + userDatabaseEnabled=true → синтаксис OK', () => {
  const code = genDB(addNode('ban_user', 'ban_m07', {}), 'm07');
  syntax(code, 'm07');
  ok(code.includes('ban_chat_member'), 'ban_chat_member должен быть');
});

test('M08', 'location с yandex + showDirections + generateMapPreview → синтаксис OK', () => {
  const code = gen(addNode('location', 'loc_m08', {
    command: '/location',
    mapService: 'yandex',
    yandexMapUrl: 'https://yandex.ru/maps/?ll=37.6176,55.7558',
    generateMapPreview: true,
    showDirections: true,
    latitude: 55.7558,
    longitude: 37.6176,
  }), 'm08');
  syntax(code, 'm08');
  ok(code.includes('extract_coordinates_from_yandex'), 'extract_coordinates_from_yandex должен быть');
  ok(code.includes('Маршрут'), 'кнопки маршрута должны быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Граничные случаи ──────────────────────────────────────');

test('N01', 'ban_user: очень длинный reason (500 символов) → синтаксис OK', () => {
  const longReason = 'А'.repeat(500);
  const code = gen(addNode('ban_user', 'ban_n01', { reason: longReason }), 'n01');
  syntax(code, 'n01');
  ok(code.includes(longReason), 'длинная причина должна быть в коде');
});

test('N02', 'ban_user: reason с кавычками → синтаксис OK', () => {
  const code = gen(addNode('ban_user', 'ban_n02', { reason: 'Причина "тест" и ещё' }), 'n02');
  syntax(code, 'n02');
  ok(code.includes('ban_chat_member'), 'ban_chat_member должен быть');
});

test('N03', 'mute_user: duration=1 (1 секунда) → синтаксис OK', () => {
  const code = gen(addNode('mute_user', 'mute_n03', { duration: 1 }), 'n03');
  syntax(code, 'n03');
  ok(code.includes('restrict_chat_member'), 'restrict_chat_member должен быть');
});

test('N04', 'mute_user: duration=2592000 (30 дней) → синтаксис OK', () => {
  const code = gen(addNode('mute_user', 'mute_n04', { duration: 2592000 }), 'n04');
  syntax(code, 'n04');
  ok(code.includes('2592000'), '2592000 должен быть в коде');
});

test('N05', 'promote_user: nodeId со спецсимволами → синтаксис OK', () => {
  const code = gen(addNode('promote_user', 'promote.node@special!', {}), 'n05');
  syntax(code, 'n05');
  ok(code.includes('promote_chat_member'), 'promote_chat_member должен быть');
});

test('N06', 'pin_message: messageText с кириллицей и эмодзи → синтаксис OK', () => {
  const code = gen(addNode('pin_message', 'pin_n06', {
    messageText: '📌 Закреплено! Важное сообщение 🎉',
  }), 'n06');
  syntax(code, 'n06');
  ok(code.includes('pin_chat_message'), 'pin_chat_message должен быть');
});

test('N07', 'contact: phoneNumber со скобками и дефисами → синтаксис OK', () => {
  const code = gen(addNode('contact', 'contact_n07', {
    command: '/contact',
    phoneNumber: '+7 (800) 555-35-35',
  }), 'n07');
  syntax(code, 'n07');
  ok(code.includes('answer_contact'), 'answer_contact должен быть');
});

test('N08', 'location: координаты 0,0 → синтаксис OK', () => {
  const code = gen(addNode('location', 'loc_n08', {
    command: '/location',
    latitude: 0,
    longitude: 0,
    title: '',
    address: '',
  }), 'n08');
  syntax(code, 'n08');
  ok(
    code.includes('answer_location') || code.includes('answer_venue'),
    'answer_location или answer_venue должен быть'
  );
});

test('N09', 'location: отрицательные координаты (-33.8688, 151.2093) → синтаксис OK', () => {
  const code = gen(addNode('location', 'loc_n09', {
    command: '/location',
    latitude: -33.8688,
    longitude: 151.2093,
    title: '',
    address: '',
  }), 'n09');
  syntax(code, 'n09');
  ok(code.includes('-33.8688'), 'отрицательная широта должна быть в коде');
  ok(code.includes('151.2093'), 'долгота должна быть в коде');
});

test('N10', 'все user-handler типы с пустыми synonyms → дефолтные синонимы, синтаксис OK', () => {
  const types = [
    { type: 'ban_user',     id: 'ban_n10',     defaultSynonym: 'забанить' },
    { type: 'unban_user',   id: 'unban_n10',   defaultSynonym: 'разбанить' },
    { type: 'kick_user',    id: 'kick_n10',    defaultSynonym: 'кикнуть' },
    { type: 'mute_user',    id: 'mute_n10',    defaultSynonym: 'замутить' },
    { type: 'unmute_user',  id: 'unmute_n10',  defaultSynonym: 'размутить' },
    { type: 'promote_user', id: 'promote_n10', defaultSynonym: 'повысить' },
    { type: 'demote_user',  id: 'demote_n10',  defaultSynonym: 'понизить' },
  ];
  for (const { type, id, defaultSynonym } of types) {
    const code = gen(addNode(type, id, { synonyms: [] }), `n10_${type}`);
    syntax(code, `n10_${type}`);
    ok(code.includes(defaultSynonym), `дефолтный синоним "${defaultSynonym}" должен быть для ${type}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total  = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
