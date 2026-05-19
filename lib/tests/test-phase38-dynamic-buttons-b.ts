/**
 * @fileoverview Фаза — Динамические кнопки (часть B: блоки D, E, F)
 *
 * Блок D: Колонки и раскладка (6 тестов)
 * Блок E: Интеграция с keyboard-нодой (6 тестов)
 * Блок F: Граничные случаи (6 тестов)
 */

import { makeProject, gen, syntax, ok, test, assertExcludes, makeStartNode, makeDynamicMessageNode, makeDynamicKeyboardNode, printSummaryAndExit, type Result } from './test-phase-dynamic-buttons-helpers.ts';

const results: Result[] = [];
/** Обёртка теста с захватом результатов */
const t = (id: string, name: string, fn: () => void) => test(results, id, name, fn);

/** Создаёт простой message-узел без клавиатуры */
const makeSimpleMsg = (id: string, text = 'Ок') => ({ id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false } });

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Динамические кнопки (D–F)                                 ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок D: Колонки и раскладка ══════════════════════════════════════════════
console.log('══ Блок D: Колонки и раскладка ══════════════════════════════════════');

t('D01', 'columns=1 → builder.adjust(1)', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 1 })]), 'd01').includes('builder.adjust(1)'), 'builder.adjust(1) не найдено');
});
t('D02', 'columns=3 → builder.adjust(3)', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 3 })]), 'd02').includes('builder.adjust(3)'), 'builder.adjust(3) не найдено');
});
t('D03', 'columns=6 → builder.adjust(6)', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 6 })]), 'd03').includes('builder.adjust(6)'), 'builder.adjust(6) не найдено');
});
t('D04', 'columns=2 (дефолт) → builder.adjust(2)', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 2 })]), 'd04').includes('builder.adjust(2)'), 'builder.adjust(2) не найдено');
});
t('D05', 'keyboard-нода с enableDynamicButtons=true → форсирует inline (нет ReplyKeyboardBuilder)', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  const code = gen(makeProject([makeStartNode(), msg, makeDynamicKeyboardNode('kbd1')]), 'd05');
  assertExcludes(code, ['ReplyKeyboardBuilder()'], 'D05');
  ok(code.includes('InlineKeyboardBuilder()'), 'InlineKeyboardBuilder() не найдено');
});
t('D06', 'синтаксис Python OK с разными columns', () => {
  for (const columns of [1, 2, 3, 4, 5, 6])
    syntax(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns })]), `d06_${columns}`), `d06_${columns}`);
});

// ══ Блок E: Интеграция с keyboard-нодой ══════════════════════════════════════
console.log('\n══ Блок E: Интеграция с keyboard-нодой ══════════════════════════════');

t('E01', 'keyboard-нода с enableDynamicButtons=true → данные переносятся в message', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  ok(gen(makeProject([makeStartNode(), msg, makeDynamicKeyboardNode('kbd1')]), 'e01').includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено — данные не перенесены');
});
t('E02', 'message с keyboardNodeId + keyboard-нода с динамическими кнопками → _resolve_dynamic_path', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  const code = gen(makeProject([makeStartNode(), msg, makeDynamicKeyboardNode('kbd1', { sourceVariable: 'tasks' })]), 'e02');
  ok(code.includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено');
  ok(code.includes('all_user_vars.get("tasks")'), 'sourceVariable "tasks" не найдено');
});
t('E03', 'keyboard-нода без host message с enableDynamicButtons=true → безопасно игнорируется', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicKeyboardNode('kbd_orphan')]), 'e03');
  ok(typeof code === 'string' && code.length > 0, 'Генерация вернула пустой результат');
  syntax(code, 'e03');
});
t('E04', 'message с legacy inline + keyboard-нода с динамическими кнопками → keyboard побеждает', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [{ id: 'b1', text: 'Статика', action: 'goto', target: 'msg2' }], keyboardType: 'inline', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  ok(gen(makeProject([makeStartNode(), msg, makeDynamicKeyboardNode('kbd1'), makeSimpleMsg('msg2')]), 'e04').includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено — keyboard-нода не победила');
});
t('E05', 'динамические кнопки + статические кнопки в одном узле → используются динамические', () => {
  const node = makeDynamicMessageNode('msg1', 'Меню');
  (node.data as any).buttons = [{ id: 'b1', text: 'Статика', action: 'goto', target: 'msg2' }];
  ok(gen(makeProject([makeStartNode(), node, makeSimpleMsg('msg2')]), 'e05').includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено — динамические кнопки не используются');
});
t('E06', 'синтаксис Python OK для интеграции keyboard-ноды', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  syntax(gen(makeProject([makeStartNode(), msg, makeDynamicKeyboardNode('kbd1')]), 'e06'), 'e06');
});

// ══ Блок F: Граничные случаи ══════════════════════════════════════════════════
console.log('\n══ Блок F: Граничные случаи ══════════════════════════════════════════');

t('F01', 'пустой sourceVariable → код генерируется без ошибок', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { sourceVariable: '' })]), 'f01');
  ok(typeof code === 'string' && code.length > 0, 'Генерация вернула пустой результат');
  ok(code.includes('all_user_vars.get("")'), 'all_user_vars.get("") не найдено');
});
t('F02', 'enableDynamicButtons=true без dynamicButtons → не генерирует dynamic код', () => {
  const node = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'inline', enableDynamicButtons: true, formatMode: 'none', markdown: false } };
  assertExcludes(gen(makeProject([makeStartNode(), node]), 'f02'), ['_resolve_dynamic_path'], 'F02');
});
t('F03', 'keyboardType: "reply" + enableDynamicButtons=true → форсируется inline', () => {
  const node = makeDynamicMessageNode('msg1', 'Меню');
  (node.data as any).keyboardType = 'reply';
  const code = gen(makeProject([makeStartNode(), node]), 'f03');
  ok(code.includes('InlineKeyboardBuilder()'), 'InlineKeyboardBuilder() не найдено — inline не форсирован');
  assertExcludes(code, ['ReplyKeyboardBuilder()'], 'F03');
});
t('F04', 'очень длинный callbackTemplate → код генерируется без ошибок', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { callbackTemplate: 'action_' + 'x'.repeat(200) + '_{id}' })]), 'f04');
  ok(typeof code === 'string' && code.length > 0, 'Генерация вернула пустой результат');
  syntax(code, 'f04');
});
t('F05', 'columns=0 (невалидное) → нормализуется до 1, синтаксис OK', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 0 })]), 'f05');
  ok(code.includes('builder.adjust(1)') || code.includes('builder.adjust(2)'), 'builder.adjust с нормализованным значением не найдено');
  syntax(code, 'f05');
});
t('F06', 'весь проект с динамическими кнопками компилируется в Python', () => {
  syntax(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Выберите проект', { sourceVariable: 'projects', arrayPath: 'data.items', textTemplate: '{name}', callbackTemplate: 'proj_{id}', styleMode: 'field', styleField: 'status', columns: 3 }), makeSimpleMsg('msg2')]), 'f06'), 'f06');
});

// ══ Блок G: Комбинированный режим (динамические + статические) ════════════════
console.log('\n── Блок G: Комбинированный режим ───────────────────────────────');

t('G01', 'enableDynamicButtons + статические кнопки → оба типа в коде', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  const kbd = {
    id: 'kbd1', type: 'keyboard', position: { x: 0, y: 0 },
    data: {
      keyboardType: 'inline',
      enableDynamicButtons: true,
      dynamicButtons: { sourceVariable: 'projects', arrayPath: 'items', textTemplate: '📁 {name}', callbackTemplate: 'project_{id}', columns: 1, styleMode: 'none', styleField: '', styleTemplate: '' },
      buttons: [{ id: 'btn1', text: '➕ Новый', action: 'goto', target: 'new_node', hideAfterClick: false, skipDataCollection: false }],
    }
  };
  const code = gen(makeProject([makeStartNode(), msg, kbd]), 'g01');
  ok(code.includes('_resolve_dynamic_path'), 'динамические кнопки не найдены');
  ok(code.includes('➕ Новый'), 'статическая кнопка не найдена');
});

t('G02', 'комбинированный режим — синтаксис Python OK', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  const kbd = {
    id: 'kbd1', type: 'keyboard', position: { x: 0, y: 0 },
    data: {
      keyboardType: 'inline',
      enableDynamicButtons: true,
      dynamicButtons: { sourceVariable: 'items', arrayPath: '', textTemplate: '{name}', callbackTemplate: 'item_{id}', columns: 2, styleMode: 'none', styleField: '', styleTemplate: '' },
      buttons: [
        { id: 'btn1', text: '❌ Отмена', action: 'goto', target: 'cancel', hideAfterClick: false, skipDataCollection: false },
        { id: 'btn2', text: '🔄 Обновить', action: 'goto', target: 'refresh', hideAfterClick: false, skipDataCollection: false },
      ],
    }
  };
  syntax(gen(makeProject([makeStartNode(), msg, kbd]), 'g02'), 'g02');
});

t('G03', 'enableDynamicButtons без статических кнопок — поведение не изменилось', () => {
  const msg = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false, keyboardNodeId: 'kbd1' } };
  const kbd = {
    id: 'kbd1', type: 'keyboard', position: { x: 0, y: 0 },
    data: {
      keyboardType: 'inline',
      enableDynamicButtons: true,
      dynamicButtons: { sourceVariable: 'items', arrayPath: '', textTemplate: '{name}', callbackTemplate: 'item_{id}', columns: 2, styleMode: 'none', styleField: '', styleTemplate: '' },
      buttons: [],
    }
  };
  const code = gen(makeProject([makeStartNode(), msg, kbd]), 'g03');
  ok(code.includes('_resolve_dynamic_path'), 'динамические кнопки не найдены');
  syntax(code, 'g03');
});

printSummaryAndExit(results, 'D–G');
