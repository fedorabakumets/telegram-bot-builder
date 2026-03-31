/**
 * @fileoverview Тесты для nodeColors и nodeIcons
 *
 * Блок A: nodeColors — наличие всех типов узлов
 * Блок B: nodeColors — цветовые токены для каждого типа
 * Блок C: nodeColors — структурные CSS-классы
 * Блок D: nodeColors — специальные стили (модераторские, admin_rights)
 * Блок E: nodeColors — качество данных (нет null/undefined, ключи без пробелов)
 * Блок F: nodeIcons — наличие всех типов узлов
 * Блок G: nodeIcons — конкретные иконки для каждого типа
 * Блок H: nodeIcons — формат и качество данных
 * Блок I: Синхронность ключей nodeColors и nodeIcons
 * Блок J: Дополнительные инварианты
 */

import { nodeColors } from '../canvas-node/node-colors';
import { nodeIcons } from '../canvas-node/node-icons';

// ─── Утилиты ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertContains(value: string, substring: string, context: string) {
  if (!value.includes(substring))
    throw new Error(`${context}: ожидалось наличие "${substring}" в "${value}"`);
}

// ─── Ожидаемые типы узлов ─────────────────────────────────────────────────────

const EXPECTED_TYPES = [
  'start', 'message', 'photo', 'video', 'audio', 'document', 'keyboard',
  'command', 'sticker', 'voice', 'animation', 'location', 'contact',
  'pin_message', 'unpin_message', 'delete_message', 'forward_message', 'ban_user', 'unban_user',
  'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user',
  'admin_rights', 'input', 'condition', 'broadcast', 'client_auth',
];

const MODERATOR_TYPES = [
  'pin_message', 'unpin_message', 'delete_message', 'forward_message',
  'ban_user', 'unban_user', 'mute_user', 'unmute_user',
  'kick_user', 'promote_user', 'demote_user', 'admin_rights',
];

const REGULAR_TYPES = [
  'start', 'message', 'photo', 'video', 'audio', 'document', 'keyboard',
  'command', 'sticker', 'voice', 'animation', 'location', 'contact',
  'input', 'condition', 'broadcast', 'client_auth',
];

// ─── Блок A: nodeColors — наличие всех типов узлов ───────────────────────────

console.log('\nБлок A: nodeColors — наличие всех типов узлов');

for (const type of EXPECTED_TYPES) {
  test(`nodeColors содержит тип "${type}"`, () => {
    assert(type in nodeColors, `Отсутствует тип "${type}"`);
    assert(!!nodeColors[type], `Значение для "${type}" пустое`);
  });
}

// ─── Блок B: nodeColors — цветовые токены для каждого типа ───────────────────

console.log('\nБлок B: nodeColors — цветовые токены для каждого типа');

test('start содержит emerald', () => {
  assertContains(nodeColors['start'], 'emerald', 'start');
});

test('message содержит blue', () => {
  assertContains(nodeColors['message'], 'blue', 'message');
});

test('command содержит indigo', () => {
  assertContains(nodeColors['command'], 'indigo', 'command');
});

test('photo содержит purple', () => {
  assertContains(nodeColors['photo'], 'purple', 'photo');
});

test('video содержит rose', () => {
  assertContains(nodeColors['video'], 'rose', 'video');
});

test('audio содержит orange', () => {
  assertContains(nodeColors['audio'], 'orange', 'audio');
});

test('document содержит teal', () => {
  assertContains(nodeColors['document'], 'teal', 'document');
});

test('keyboard содержит amber', () => {
  assertContains(nodeColors['keyboard'], 'amber', 'keyboard');
});

test('sticker содержит pink', () => {
  assertContains(nodeColors['sticker'], 'pink', 'sticker');
});

test('voice содержит emerald', () => {
  assertContains(nodeColors['voice'], 'emerald', 'voice');
});

test('animation содержит yellow', () => {
  assertContains(nodeColors['animation'], 'yellow', 'animation');
});

test('location содержит green', () => {
  assertContains(nodeColors['location'], 'green', 'location');
});

test('contact содержит sky', () => {
  assertContains(nodeColors['contact'], 'sky', 'contact');
});

test('ban_user содержит red', () => {
  assertContains(nodeColors['ban_user'], 'red', 'ban_user');
});

test('delete_message содержит red', () => {
  assertContains(nodeColors['delete_message'], 'red', 'delete_message');
});

test('forward_message содержит amber', () => {
  assertContains(nodeColors['forward_message'], 'amber', 'forward_message');
});

test('admin_rights содержит violet', () => {
  assertContains(nodeColors['admin_rights'], 'violet', 'admin_rights');
});

test('condition содержит indigo', () => {
  assertContains(nodeColors['condition'], 'indigo', 'condition');
});

test('broadcast содержит purple', () => {
  assertContains(nodeColors['broadcast'], 'purple', 'broadcast');
});

// ─── Блок C: nodeColors — структурные CSS-классы ─────────────────────────────

console.log('\nБлок C: nodeColors — структурные CSS-классы');

test('все значения содержат bg-gradient-to-br', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('bg-gradient-to-br'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет bg-gradient-to-br у: ${missing.join(', ')}`);
});

test('все значения содержат from-', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('from-'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет from- у: ${missing.join(', ')}`);
});

test('все значения содержат to-', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('to-'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет to- у: ${missing.join(', ')}`);
});

test('все значения содержат text-', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('text-'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет text- у: ${missing.join(', ')}`);
});

test('все значения содержат border', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('border'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет border у: ${missing.join(', ')}`);
});

test('все значения содержат dark: классы', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('dark:'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет dark: классов у: ${missing.join(', ')}`);
});

// ─── Блок D: nodeColors — специальные стили ──────────────────────────────────

console.log('\nБлок D: nodeColors — специальные стили');

test('admin_rights содержит ring классы', () => {
  assertContains(nodeColors['admin_rights'], 'ring', 'admin_rights');
});

test('admin_rights содержит ring-1', () => {
  assertContains(nodeColors['admin_rights'], 'ring-1', 'admin_rights');
});

test('admin_rights содержит shadow-xl (усиленная тень)', () => {
  assertContains(nodeColors['admin_rights'], 'shadow-xl', 'admin_rights');
});

test('модераторские типы содержат border-2', () => {
  for (const type of MODERATOR_TYPES) {
    assertContains(nodeColors[type], 'border-2', type);
  }
});

test('модераторские типы (кроме admin_rights) содержат shadow-lg', () => {
  for (const type of MODERATOR_TYPES) {
    if (type === 'admin_rights') continue; // admin_rights использует shadow-xl
    assertContains(nodeColors[type], 'shadow-lg', type);
  }
});

test('admin_rights содержит shadow-xl вместо shadow-lg', () => {
  assert(!nodeColors['admin_rights'].includes('shadow-lg'), 'admin_rights не должен содержать shadow-lg');
  assertContains(nodeColors['admin_rights'], 'shadow-xl', 'admin_rights');
});

test('обычные типы содержат border (без border-2)', () => {
  for (const type of REGULAR_TYPES) {
    const val = nodeColors[type];
    assertContains(val, 'border', type);
    // Обычные типы не должны иметь border-2
    assert(!val.includes('border-2'), `${type} не должен содержать border-2`);
  }
});

test('обычные типы не содержат shadow-lg', () => {
  for (const type of REGULAR_TYPES) {
    assert(!nodeColors[type].includes('shadow-lg'), `${type} не должен содержать shadow-lg`);
  }
});

// ─── Блок E: nodeColors — качество данных ────────────────────────────────────

console.log('\nБлок E: nodeColors — качество данных');

test('nodeColors не содержит undefined значений', () => {
  const bad = Object.entries(nodeColors)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  assert(bad.length === 0, `undefined значения у: ${bad.join(', ')}`);
});

test('nodeColors не содержит null значений', () => {
  const bad = Object.entries(nodeColors)
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  assert(bad.length === 0, `null значения у: ${bad.join(', ')}`);
});

test('nodeColors не содержит пустых строк', () => {
  const bad = Object.entries(nodeColors)
    .filter(([, v]) => !v || !v.trim())
    .map(([k]) => k);
  assert(bad.length === 0, `Пустые значения у: ${bad.join(', ')}`);
});

test('все ключи nodeColors — строки без пробелов', () => {
  const bad = Object.keys(nodeColors).filter(k => /\s/.test(k));
  assert(bad.length === 0, `Ключи с пробелами: ${bad.join(', ')}`);
});

test('все ключи nodeColors — непустые строки', () => {
  const bad = Object.keys(nodeColors).filter(k => !k.trim());
  assert(bad.length === 0, `Пустые ключи: ${bad.join(', ')}`);
});

// ─── Блок F: nodeIcons — наличие всех типов узлов ────────────────────────────

console.log('\nБлок F: nodeIcons — наличие всех типов узлов');

for (const type of EXPECTED_TYPES) {
  test(`nodeIcons содержит тип "${type}"`, () => {
    assert(type in nodeIcons, `Отсутствует тип "${type}"`);
    assert(!!nodeIcons[type], `Значение для "${type}" пустое`);
  });
}

// ─── Блок G: nodeIcons — конкретные иконки для каждого типа ──────────────────

console.log('\nБлок G: nodeIcons — конкретные иконки для каждого типа');

test('start → fas fa-play', () => {
  assert(nodeIcons['start'] === 'fas fa-play', `Ожидалось "fas fa-play", получено "${nodeIcons['start']}"`);
});

test('message → fas fa-comment', () => {
  assert(nodeIcons['message'] === 'fas fa-comment', `Ожидалось "fas fa-comment", получено "${nodeIcons['message']}"`);
});

test('photo → fas fa-image', () => {
  assert(nodeIcons['photo'] === 'fas fa-image', `Ожидалось "fas fa-image", получено "${nodeIcons['photo']}"`);
});

test('video → fas fa-video', () => {
  assert(nodeIcons['video'] === 'fas fa-video', `Ожидалось "fas fa-video", получено "${nodeIcons['video']}"`);
});

test('audio → fas fa-music', () => {
  assert(nodeIcons['audio'] === 'fas fa-music', `Ожидалось "fas fa-music", получено "${nodeIcons['audio']}"`);
});

test('document → fas fa-file-alt', () => {
  assert(nodeIcons['document'] === 'fas fa-file-alt', `Ожидалось "fas fa-file-alt", получено "${nodeIcons['document']}"`);
});

test('keyboard → fas fa-keyboard', () => {
  assert(nodeIcons['keyboard'] === 'fas fa-keyboard', `Ожидалось "fas fa-keyboard", получено "${nodeIcons['keyboard']}"`);
});

test('command → fas fa-terminal', () => {
  assert(nodeIcons['command'] === 'fas fa-terminal', `Ожидалось "fas fa-terminal", получено "${nodeIcons['command']}"`);
});

test('sticker → fas fa-laugh', () => {
  assert(nodeIcons['sticker'] === 'fas fa-laugh', `Ожидалось "fas fa-laugh", получено "${nodeIcons['sticker']}"`);
});

test('voice → fas fa-microphone', () => {
  assert(nodeIcons['voice'] === 'fas fa-microphone', `Ожидалось "fas fa-microphone", получено "${nodeIcons['voice']}"`);
});

test('animation → fas fa-film', () => {
  assert(nodeIcons['animation'] === 'fas fa-film', `Ожидалось "fas fa-film", получено "${nodeIcons['animation']}"`);
});

test('location → fas fa-map-marker-alt', () => {
  assert(nodeIcons['location'] === 'fas fa-map-marker-alt', `Ожидалось "fas fa-map-marker-alt", получено "${nodeIcons['location']}"`);
});

test('contact → fas fa-address-book', () => {
  assert(nodeIcons['contact'] === 'fas fa-address-book', `Ожидалось "fas fa-address-book", получено "${nodeIcons['contact']}"`);
});

test('pin_message → fas fa-thumbtack', () => {
  assert(nodeIcons['pin_message'] === 'fas fa-thumbtack', `Ожидалось "fas fa-thumbtack", получено "${nodeIcons['pin_message']}"`);
});

test('delete_message → fas fa-trash', () => {
  assert(nodeIcons['delete_message'] === 'fas fa-trash', `Ожидалось "fas fa-trash", получено "${nodeIcons['delete_message']}"`);
});

test('forward_message → fas fa-share', () => {
  assert(nodeIcons['forward_message'] === 'fas fa-share', `Ожидалось "fas fa-share", получено "${nodeIcons['forward_message']}"`);
});

test('ban_user → fas fa-ban', () => {
  assert(nodeIcons['ban_user'] === 'fas fa-ban', `Ожидалось "fas fa-ban", получено "${nodeIcons['ban_user']}"`);
});

test('unban_user → fas fa-user-check', () => {
  assert(nodeIcons['unban_user'] === 'fas fa-user-check', `Ожидалось "fas fa-user-check", получено "${nodeIcons['unban_user']}"`);
});

test('mute_user → fas fa-volume-mute', () => {
  assert(nodeIcons['mute_user'] === 'fas fa-volume-mute', `Ожидалось "fas fa-volume-mute", получено "${nodeIcons['mute_user']}"`);
});

test('kick_user → fas fa-user-times', () => {
  assert(nodeIcons['kick_user'] === 'fas fa-user-times', `Ожидалось "fas fa-user-times", получено "${nodeIcons['kick_user']}"`);
});

test('promote_user → fas fa-crown', () => {
  assert(nodeIcons['promote_user'] === 'fas fa-crown', `Ожидалось "fas fa-crown", получено "${nodeIcons['promote_user']}"`);
});

test('admin_rights → fas fa-user-shield', () => {
  assert(nodeIcons['admin_rights'] === 'fas fa-user-shield', `Ожидалось "fas fa-user-shield", получено "${nodeIcons['admin_rights']}"`);
});

test('input → fas fa-edit', () => {
  assert(nodeIcons['input'] === 'fas fa-edit', `Ожидалось "fas fa-edit", получено "${nodeIcons['input']}"`);
});

test('condition → fas fa-code-branch', () => {
  assert(nodeIcons['condition'] === 'fas fa-code-branch', `Ожидалось "fas fa-code-branch", получено "${nodeIcons['condition']}"`);
});

test('broadcast → fas fa-bullhorn', () => {
  assert(nodeIcons['broadcast'] === 'fas fa-bullhorn', `Ожидалось "fas fa-bullhorn", получено "${nodeIcons['broadcast']}"`);
});

// ─── Блок H: nodeIcons — формат и качество данных ────────────────────────────

console.log('\nБлок H: nodeIcons — формат и качество данных');

test('все иконки начинаются с "fas fa-"', () => {
  const invalid = Object.entries(nodeIcons)
    .filter(([, v]) => !v.startsWith('fas fa-'))
    .map(([k]) => k);
  assert(invalid.length === 0, `Неверный формат у: ${invalid.join(', ')}`);
});

test('все иконки не пустые', () => {
  const empty = Object.entries(nodeIcons)
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  assert(empty.length === 0, `Пустые иконки у: ${empty.join(', ')}`);
});

test('nodeIcons не содержит undefined значений', () => {
  const bad = Object.entries(nodeIcons)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  assert(bad.length === 0, `undefined значения у: ${bad.join(', ')}`);
});

test('nodeIcons не содержит null значений', () => {
  const bad = Object.entries(nodeIcons)
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  assert(bad.length === 0, `null значения у: ${bad.join(', ')}`);
});

test('все ключи nodeIcons — строки без пробелов', () => {
  const bad = Object.keys(nodeIcons).filter(k => /\s/.test(k));
  assert(bad.length === 0, `Ключи с пробелами: ${bad.join(', ')}`);
});

test('все ключи nodeIcons — непустые строки', () => {
  const bad = Object.keys(nodeIcons).filter(k => !k.trim());
  assert(bad.length === 0, `Пустые ключи: ${bad.join(', ')}`);
});

test('иконки содержат только допустимые символы (fa-*)', () => {
  const invalid = Object.entries(nodeIcons)
    .filter(([, v]) => !/^fas fa-[a-z0-9-]+$/.test(v))
    .map(([k, v]) => `${k}: "${v}"`);
  assert(invalid.length === 0, `Недопустимый формат иконок: ${invalid.join(', ')}`);
});

// ─── Блок I: Синхронность ключей ─────────────────────────────────────────────

console.log('\nБлок I: Синхронность ключей');

test('nodeColors и nodeIcons имеют одинаковый набор ключей', () => {
  const colorKeys = Object.keys(nodeColors).sort();
  const iconKeys = Object.keys(nodeIcons).sort();
  const onlyInColors = colorKeys.filter(k => !iconKeys.includes(k));
  const onlyInIcons = iconKeys.filter(k => !colorKeys.includes(k));
  const msgs: string[] = [];
  if (onlyInColors.length) msgs.push(`Только в nodeColors: ${onlyInColors.join(', ')}`);
  if (onlyInIcons.length) msgs.push(`Только в nodeIcons: ${onlyInIcons.join(', ')}`);
  assert(msgs.length === 0, msgs.join('\n'));
});

test('количество ключей nodeColors === количество ключей nodeIcons', () => {
  const cLen = Object.keys(nodeColors).length;
  const iLen = Object.keys(nodeIcons).length;
  assert(cLen === iLen, `nodeColors: ${cLen} ключей, nodeIcons: ${iLen} ключей`);
});

test('каждый ключ nodeColors есть в nodeIcons', () => {
  for (const key of Object.keys(nodeColors)) {
    assert(key in nodeIcons, `Ключ "${key}" из nodeColors отсутствует в nodeIcons`);
  }
});

test('каждый ключ nodeIcons есть в nodeColors', () => {
  for (const key of Object.keys(nodeIcons)) {
    assert(key in nodeColors, `Ключ "${key}" из nodeIcons отсутствует в nodeColors`);
  }
});

// ─── Блок J: Дополнительные инварианты ───────────────────────────────────────

console.log('\nБлок J: Дополнительные инварианты');

test('nodeColors содержит не менее 25 типов', () => {
  const count = Object.keys(nodeColors).length;
  assert(count >= 25, `Ожидалось >= 25 типов, получено ${count}`);
});

test('nodeIcons содержит не менее 25 типов', () => {
  const count = Object.keys(nodeIcons).length;
  assert(count >= 25, `Ожидалось >= 25 типов, получено ${count}`);
});

test('нет дублирующихся иконок среди уникальных типов (кроме намеренных)', () => {
  // admin_rights и client_auth намеренно используют fa-user-shield
  const intentionalDuplicates = new Set(['admin_rights', 'client_auth']);
  const iconCounts: Record<string, string[]> = {};
  for (const [type, icon] of Object.entries(nodeIcons)) {
    if (!iconCounts[icon]) iconCounts[icon] = [];
    iconCounts[icon].push(type);
  }
  const unexpectedDuplicates = Object.entries(iconCounts)
    .filter(([, types]) => types.length > 1)
    .filter(([, types]) => !types.every(t => intentionalDuplicates.has(t)))
    .map(([icon, types]) => `"${icon}": [${types.join(', ')}]`);
  assert(unexpectedDuplicates.length === 0, `Неожиданные дубликаты иконок: ${unexpectedDuplicates.join('; ')}`);
});

test('все значения nodeColors — строки', () => {
  for (const [key, val] of Object.entries(nodeColors)) {
    assert(typeof val === 'string', `nodeColors["${key}"] не является строкой`);
  }
});

test('все значения nodeIcons — строки', () => {
  for (const [key, val] of Object.entries(nodeIcons)) {
    assert(typeof val === 'string', `nodeIcons["${key}"] не является строкой`);
  }
});

test('все значения nodeColors содержат dark:from-', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('dark:from-'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет dark:from- у: ${missing.join(', ')}`);
});

test('все значения nodeColors содержат dark:to-', () => {
  const missing = Object.entries(nodeColors)
    .filter(([, v]) => !v.includes('dark:to-'))
    .map(([k]) => k);
  assert(missing.length === 0, `Нет dark:to- у: ${missing.join(', ')}`);
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
