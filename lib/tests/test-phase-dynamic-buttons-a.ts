/**
 * @fileoverview Фаза — Динамические кнопки (часть A: блоки A, B, C)
 *
 * Блок A: Базовая генерация (8 тестов)
 * Блок B: Шаблоны текста и callback (8 тестов)
 * Блок C: Стили кнопок (8 тестов)
 */

import { makeProject, gen, syntax, ok, test, assertIncludesAll, assertExcludes, makeStartNode, makeDynamicMessageNode, printSummaryAndExit, type Result } from './test-phase-dynamic-buttons-helpers.ts';

const results: Result[] = [];
/** Обёртка теста с захватом результатов */
const t = (id: string, name: string, fn: () => void) => test(results, id, name, fn);

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Динамические кнопки (A–C)                                 ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок A: Базовая генерация ═════════════════════════════════════════════════
console.log('══ Блок A: Базовая генерация ════════════════════════════════════════');

t('A01', 'enableDynamicButtons=true генерирует _resolve_dynamic_path', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a01').includes('_resolve_dynamic_path'), '_resolve_dynamic_path не найдено');
});
t('A02', 'enableDynamicButtons=true генерирует _render_dynamic_template', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a02').includes('_render_dynamic_template'), '_render_dynamic_template не найдено');
});
t('A03', 'enableDynamicButtons=true генерирует _normalize_dynamic_style', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a03').includes('_normalize_dynamic_style'), '_normalize_dynamic_style не найдено');
});
t('A04', 'генерирует _dynamic_source = all_user_vars.get("projects")', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a04').includes('all_user_vars.get("projects")'), '_dynamic_source с "projects" не найдено');
});
t('A05', 'columns=2 генерирует builder.adjust(2)', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { columns: 2 })]), 'a05').includes('builder.adjust(2)'), 'builder.adjust(2) не найдено');
});
t('A06', 'enableDynamicButtons=true генерирует InlineKeyboardBuilder (не ReplyKeyboardBuilder)', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a06');
  assertIncludesAll(code, ['InlineKeyboardBuilder()'], 'A06');
  assertExcludes(code, ['ReplyKeyboardBuilder()'], 'A06');
});
t('A07', 'enableDynamicButtons=false НЕ генерирует _resolve_dynamic_path', () => {
  const node = makeDynamicMessageNode('msg1');
  (node.data as any).enableDynamicButtons = false;
  assertExcludes(gen(makeProject([makeStartNode(), node]), 'a07'), ['_resolve_dynamic_path'], 'A07');
});
t('A08', 'синтаксис Python OK для базовой генерации', () => {
  syntax(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'a08'), 'a08');
});

// ══ Блок B: Шаблоны текста и callback ════════════════════════════════════════
console.log('\n══ Блок B: Шаблоны текста и callback ════════════════════════════════');

t('B01', 'textTemplate "{name}" присутствует в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { textTemplate: '{name}' })]), 'b01').includes('{name}'), '{name} не найдено');
});
t('B02', 'callbackTemplate "project_{id}" присутствует в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { callbackTemplate: 'project_{id}' })]), 'b02').includes('project_{id}'), 'project_{id} не найдено');
});
t('B03', 'вложенный arrayPath "data.results" присутствует в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { arrayPath: 'data.results' })]), 'b03').includes('data.results'), 'data.results не найдено');
});
t('B04', 'пустой arrayPath — пустая строка в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { arrayPath: '' })]), 'b04').includes('""'), 'пустая строка arrayPath не найдена');
});
t('B05', '_render_dynamic_template вызывается для текста', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'b05').includes('_render_dynamic_template'), '_render_dynamic_template не найдено');
});
t('B06', '_render_dynamic_template вызывается для callback', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1')]), 'b06');
  const idx = code.indexOf('_render_dynamic_template');
  ok(code.indexOf('_render_dynamic_template', idx + 1) !== -1, '_render_dynamic_template вызывается менее двух раз');
});
t('B07', 'legacy поля (variable, arrayField, textField, callbackField) конвертируются', () => {
  const node = { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Меню', buttons: [], keyboardType: 'inline', enableDynamicButtons: true, dynamicButtons: { variable: 'items', arrayField: 'list', textField: '{label}', callbackField: 'cb_{id}', styleMode: 'none', styleField: '', styleTemplate: '', columns: 2 }, formatMode: 'none', markdown: false } };
  const code = gen(makeProject([makeStartNode(), node]), 'b07');
  assertIncludesAll(code, ['_resolve_dynamic_path', '_render_dynamic_template'], 'B07');
  syntax(code, 'b07');
});
t('B08', 'синтаксис Python OK с разными шаблонами', () => {
  for (const cfg of [{ textTemplate: '{title}', callbackTemplate: 'item_{id}' }, { textTemplate: '#{num} {name}', callbackTemplate: 'sel_{code}' }])
    syntax(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', cfg)]), `b08_${cfg.callbackTemplate}`), `b08_${cfg.callbackTemplate}`);
});

// ══ Блок C: Стили кнопок ═════════════════════════════════════════════════════
console.log('\n══ Блок C: Стили кнопок ═════════════════════════════════════════════');

t('C01', 'styleMode: "none" → _normalize_dynamic_style возвращает None', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'none' })]), 'c01').includes('return None'), 'return None не найдено');
});
t('C02', 'styleMode: "field" → код содержит \'field\'', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'field', styleField: 'status' })]), 'c02').includes("'field'"), "'field' не найдено");
});
t('C03', 'styleMode: "field" + styleField: "status" → "status" присутствует в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'field', styleField: 'status' })]), 'c03').includes('status'), 'status не найдено');
});
t('C04', 'styleMode: "template" → код содержит \'template\'', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'template', styleTemplate: '{status}' })]), 'c04').includes("'template'"), "'template' не найдено");
});
t('C05', 'styleMode: "template" + styleTemplate: "{status}" → {status} присутствует в коде', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'template', styleTemplate: '{status}' })]), 'c05').includes('{status}'), '{status} не найдено');
});
t('C06', 'styleMode: "none" → return None в _normalize_dynamic_style', () => {
  const code = gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'none' })]), 'c06');
  const fnIdx = code.indexOf('def _normalize_dynamic_style');
  ok(fnIdx !== -1, '_normalize_dynamic_style не найдено');
  ok(code.slice(fnIdx, fnIdx + 500).includes('return None'), 'return None не найдено в теле _normalize_dynamic_style');
});
t('C07', 'стиль не влияет на _render_dynamic_template для текста', () => {
  ok(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode: 'field', styleField: 'color' })]), 'c07').includes('_render_dynamic_template'), '_render_dynamic_template не найдено при styleMode=field');
});
t('C08', 'синтаксис Python OK для всех styleMode', () => {
  for (const [styleMode, extra] of [['none', {}], ['field', { styleField: 'status' }], ['template', { styleTemplate: '{status}' }]] as [string, any][])
    syntax(gen(makeProject([makeStartNode(), makeDynamicMessageNode('msg1', 'Меню', { styleMode, ...extra })]), `c08_${styleMode}`), `c08_${styleMode}`);
});

printSummaryAndExit(results, 'A–C');
