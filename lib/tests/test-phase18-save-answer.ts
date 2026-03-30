/**
 * @fileoverview Фаза 18 — Save Answer / dedicated input-узел и его полный сценарный прогон
 *
 * Блок A: Базовые dedicated input-узлы
 * Блок B: Матрица inputType
 * Блок C: Специальные переменные и режимы записи
 * Блок D: Цепочки и переходы между input-узлами
 * Блок E: Совместимость с legacy collectUserInput
 * Блок F: Media handlers и DB-режим
 * Блок G: Большой mixed project
 * Блок H: Краевые случаи и синтаксис
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

function makeProject(nodes: any[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string, userDatabaseEnabled = false): string {
  return generatePythonCode(project as any, {
    botName: `Phase18SaveAnswer_${label}`,
    userDatabaseEnabled,
    enableComments: false,
  });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p18_${label}.py`;
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

function block(code: string, nodeId: string): string {
  const start = code.indexOf(`# @@NODE_START:${nodeId}@@`);
  ok(start !== -1, `Блок ${nodeId} не найден`);
  const endMarker = `# @@NODE_END:${nodeId}@@`;
  const end = code.indexOf(endMarker, start);
  ok(end !== -1, `Конец блока ${nodeId} не найден`);
  return code.slice(start, end + endMarker.length);
}

function assertIncludesAll(text: string, parts: string[], context: string) {
  for (const part of parts) {
    ok(text.includes(part), `${context}: не найдено "${part}"`);
  }
}

function assertExcludes(text: string, parts: string[], context: string) {
  for (const part of parts) {
    ok(!text.includes(part), `${context}: неожиданно найдено "${part}"`);
  }
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(text: string, needle: string): number {
  const pattern = new RegExp(escapeRegExp(needle), 'g');
  return (text.match(pattern) || []).length;
}

function makeButton(
  text: string,
  action: string = 'goto',
  target: string = 'msg_next',
  extra: Record<string, any> = {},
) {
  return {
    id: extra.id ?? `btn_${safeId(text)}_${safeId(action)}_${safeId(target)}`,
    text,
    action,
    target,
    buttonType: extra.buttonType ?? 'normal',
    skipDataCollection: extra.skipDataCollection ?? false,
    hideAfterClick: extra.hideAfterClick ?? false,
    url: extra.url,
    requestContact: extra.requestContact,
    requestLocation: extra.requestLocation,
  };
}

function makeMessageNode(id: string, messageText = 'Сообщение', data: Record<string, any> = {}) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeStartNode(id = 'start_1', data: Record<string, any> = {}) {
  return {
    id,
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      command: '/start',
      messageText: 'Старт',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeCommandNode(id: string, command: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'command',
    position: { x: 0, y: 0 },
    data: {
      command,
      messageText: 'Команда',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
      ...data,
    },
  };
}

function makeKeyboardNode(
  id: string,
  keyboardType: 'inline' | 'reply' = 'inline',
  buttons: any[] = [],
  data: Record<string, any> = {},
) {
  return {
    id,
    type: 'keyboard',
    position: { x: 300, y: 0 },
    data: {
      keyboardType,
      buttons,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      ...data,
    },
  };
}

function makeConditionNode(id: string, variable: string, branches: any[], data: Record<string, any> = {}) {
  return {
    id,
    type: 'condition',
    position: { x: 0, y: 0 },
    data: {
      variable,
      branches,
      buttons: [],
      keyboardType: 'none',
      ...data,
    },
  };
}

function makeInputNode(id: string, data: Record<string, any> = {}) {
  return {
    id,
    type: 'input',
    position: { x: 300, y: 0 },
    data: {
      inputTargetNodeId: '',
      inputType: 'text',
      appendVariable: false,
      saveToDatabase: true,
      ...data,
    },
  };
}

function makeMediaNode(id: string, attachedMedia: string[] = [], data: Record<string, any> = {}) {
  return {
    id,
    type: 'media',
    position: { x: 300, y: 0 },
    data: {
      attachedMedia,
      buttons: [],
      keyboardType: 'none',
      enableAutoTransition: false,
      autoTransitionTo: '',
      ...data,
    },
  };
}

function makeLegacyInputMessage(id: string, data: Record<string, any> = {}) {
  return makeMessageNode(id, 'Legacy answer', {
    collectUserInput: true,
    enableTextInput: true,
    inputVariable: 'legacy_answer',
    inputTargetNodeId: 'msg_done',
    saveToDatabase: true,
    ...data,
  });
}

function makeFlowProject(nodes: any[]) {
  return makeProject(nodes);
}

function makeDedicatedInputChainProject() {
  return makeFlowProject([
    makeMessageNode('msg_intro', 'Начало', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_text_1',
    }),
    makeInputNode('input_text_1', {
      inputType: 'text',
      inputVariable: 'user_name',
      inputTargetNodeId: 'input_text_2',
    }),
    makeInputNode('input_text_2', {
      inputType: 'text',
      inputVariable: 'user_email',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Готово'),
  ]);
}

function makeMediaInputProject() {
  return makeFlowProject([
    makeMessageNode('msg_intro', 'Начало', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_photo_1',
    }),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'user_photo',
      photoInputVariable: 'user_photo_file',
      inputTargetNodeId: 'input_video_1',
    }),
    makeInputNode('input_video_1', {
      inputType: 'video',
      inputVariable: 'user_video',
      videoInputVariable: 'user_video_file',
      inputTargetNodeId: 'input_audio_1',
    }),
    makeInputNode('input_audio_1', {
      inputType: 'audio',
      inputVariable: 'user_audio',
      audioInputVariable: 'user_audio_file',
      inputTargetNodeId: 'input_document_1',
    }),
    makeInputNode('input_document_1', {
      inputType: 'document',
      inputVariable: 'user_document',
      documentInputVariable: 'user_document_file',
      inputTargetNodeId: 'input_location_1',
    }),
    makeInputNode('input_location_1', {
      inputType: 'location',
      inputVariable: 'user_location',
      locationInputVariable: 'user_location_point',
      inputTargetNodeId: 'input_contact_1',
    }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'user_contact',
      contactInputVariable: 'user_contact_card',
      inputTargetNodeId: 'input_any_1',
    }),
    makeInputNode('input_any_1', {
      inputType: 'any',
      inputVariable: 'user_any',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Конец'),
  ]);
}

function makeLegacyCompatibilityProject() {
  return makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      oneTimeKeyboard: true,
      resizeKeyboard: false,
      buttons: [
        makeButton('Да', 'goto', 'msg_legacy'),
        makeButton('Нет', 'goto', 'msg_done'),
      ],
    }),
    makeMessageNode('msg_legacy', 'Legacy message', {
      keyboardType: 'reply',
      collectUserInput: true,
      inputVariable: 'legacy_answer',
      inputTargetNodeId: 'input_text_1',
      enableTextInput: true,
      buttons: [makeButton('Пропустить', 'goto', 'msg_done', { skipDataCollection: true })],
    }),
    makeInputNode('input_text_1', {
      inputType: 'text',
      inputVariable: 'modern_answer',
      inputTargetNodeId: 'msg_done',
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Дальше', 'goto', 'input_contact_1')],
    }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'contact_answer',
      contactInputVariable: 'contact_card',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Готово'),
  ]);
}

function makeMixedMegaProject() {
  return makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [
        makeButton('Ввод', 'goto', 'msg_1'),
        makeButton('Помощь', 'goto', 'cmd_help'),
      ],
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('К форме', 'goto', 'msg_1')],
    }),
    makeMessageNode('msg_1', 'Текстовый старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_text_1',
      keyboardNodeId: 'kbd_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('A', 'goto', 'msg_2'),
      makeButton('B', 'goto', 'msg_3'),
    ]),
    makeInputNode('input_text_1', {
      inputType: 'text',
      inputVariable: 'field_text',
      inputTargetNodeId: 'input_photo_1',
    }),
    makeMessageNode('msg_2', 'После кнопки A', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_photo_1',
    }),
    makeMessageNode('msg_3', 'После кнопки B', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_photo_1',
    }),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'field_photo',
      photoInputVariable: 'field_photo_file',
      inputTargetNodeId: 'cond_1',
    }),
    makeConditionNode('cond_1', 'field_text', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'input_video_1' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_done' },
    ]),
    makeInputNode('input_video_1', {
      inputType: 'video',
      inputVariable: 'field_video',
      videoInputVariable: 'field_video_file',
      inputTargetNodeId: 'input_audio_1',
    }),
    makeInputNode('input_audio_1', {
      inputType: 'audio',
      inputVariable: 'field_audio',
      audioInputVariable: 'field_audio_file',
      inputTargetNodeId: 'input_document_1',
    }),
    makeInputNode('input_document_1', {
      inputType: 'document',
      inputVariable: 'field_document',
      documentInputVariable: 'field_document_file',
      inputTargetNodeId: 'input_location_1',
    }),
    makeInputNode('input_location_1', {
      inputType: 'location',
      inputVariable: 'field_location',
      locationInputVariable: 'field_location_point',
      inputTargetNodeId: 'input_contact_1',
    }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'field_contact',
      contactInputVariable: 'field_contact_card',
      inputTargetNodeId: 'input_any_1',
    }),
    makeInputNode('input_any_1', {
      inputType: 'any',
      inputVariable: 'field_any',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);
}

function makeSharedInputReuseProject() {
  return makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [
        makeButton('К shared input', 'goto', 'shared_input_1'),
        makeButton('К вопросу', 'goto', 'msg_1'),
      ],
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Shared', 'goto', 'shared_input_1')],
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
    }),
    makeMessageNode('msg_1', 'Источник 1', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
      keyboardNodeId: 'kbd_1',
    }),
    makeMessageNode('msg_2', 'Источник 2', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
    }),
    makeKeyboardNode('kbd_1', 'inline', [
      makeButton('В shared', 'goto', 'shared_input_1'),
      makeButton('В другое', 'goto', 'msg_done'),
    ]),
    makeConditionNode('cond_1', 'route_flag', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'shared_input_1' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_done' },
    ]),
    makeMessageNode('msg_legacy', 'Legacy source', {
      keyboardType: 'reply',
      collectUserInput: true,
      inputVariable: 'legacy_source_answer',
      inputTargetNodeId: 'shared_input_1',
      enableTextInput: true,
      buttons: [makeButton('Skip', 'goto', 'msg_done', { skipDataCollection: true })],
    }),
    makeInputNode('shared_input_1', {
      inputType: 'any',
      inputVariable: 'shared_answer',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);
}

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('Фаза 18 — Save Answer / dedicated input-узел');
console.log('════════════════════════════════════════════════════════════════════');

console.log('══ Блок A: Базовые dedicated input-узлы ═══════════════════════════');

test('A01', 'message -> input -> message генерирует dedicated waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Введи имя', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'user_name',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'a01');
  const msg = block(code, 'msg_1');
  const inp = block(code, 'input_1');
  assertIncludesAll(msg, ['await handle_callback_input_1(fake_callback)'], 'A01 message');
  assertIncludesAll(inp, [
    '@dp.callback_query(lambda c: c.data == "input_1")',
    'async def handle_callback_input_1',
    '"waiting_for_input"',
    '"variable": "user_name"',
    '"type": "text"',
    '"next_node_id": "msg_2"',
  ], 'A01 input');
  syntax(code, 'a01');
});

test('A02', 'message -> input -> input -> message сохраняет цепочку из двух dedicated узлов', () => {
  const project = makeDedicatedInputChainProject();
  const code = gen(project, 'a02');
  const intro = block(code, 'msg_intro');
  const first = block(code, 'input_text_1');
  const second = block(code, 'input_text_2');
  assertIncludesAll(intro, ['await handle_callback_input_text_1(fake_callback)'], 'A02 intro');
  assertIncludesAll(first, ['"variable": "user_name"', '"next_node_id": "input_text_2"'], 'A02 first');
  assertIncludesAll(second, ['"variable": "user_email"', '"next_node_id": "msg_done"'], 'A02 second');
  assertIncludesAll(code, ['await handle_callback_input_text_2(fake_callback)'], 'A02 chain');
  syntax(code, 'a02');
});

test('A03', 'dedicated input без inputVariable получает дефолт input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a03');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"variable": "input"', '"type": "text"'], 'A03');
  syntax(code, 'a03');
});

test('A04', 'dedicated input поддерживает appendVariable=true', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'stacked_answer',
      appendVariable: true,
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a04');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"appendVariable": True'], 'A04');
  syntax(code, 'a04');
});

test('A05', 'dedicated input без next_node_id сохраняет пустой переход', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'final_text',
    }),
  ]);

  const code = gen(project, 'a05');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"next_node_id": ""'], 'A05');
  syntax(code, 'a05');
});

test('A06', 'dedicated input может выключать save_to_database', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'draft_answer',
      inputTargetNodeId: 'msg_2',
      saveToDatabase: false,
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a06');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"save_to_database": False'], 'A06');
  syntax(code, 'a06');
});

test('A06b', 'dedicated input без skipDataCollection не генерирует runtime-блок пропуска', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'plain_answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a06b');
  assertExcludes(code, [
    'call_skip_target_handler',
    'skip_buttons = waiting_config.get("skip_buttons", [])',
    'skip_button_target',
  ], 'A06b');
  syntax(code, 'a06b');
});

test('A07', 'dedicated input генерирует callback-handler с подтверждением callback_query.answer()', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'ack_answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a07');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['await callback_query.answer()', 'logging.info', 'handle_callback_input_1'], 'A07');
  syntax(code, 'a07');
});

test('A08', 'dedicated input в DB-режиме использует update_user_data_in_db', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'db_answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a08', true);
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"save_to_database": True'], 'A08');
  ok(code.includes('update_user_data_in_db'), 'A08: expected DB save path');
  syntax(code, 'a08');
});

test('A09', 'dedicated input не использует legacy collectUserInput ветку', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'modern_answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'a09');
  const inp = block(code, 'input_1');
  assertExcludes(inp, ['collectUserInput', 'waiting_for_input = "input_1"'], 'A09');
  syntax(code, 'a09');
});

test('A10', 'dedicated input с узлом message после autoTransition компилируется', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Ввод', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'text_answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  syntax(gen(project, 'a10'), 'a10');
});

console.log('══ Блок B: Матрица inputType ═══════════════════════════════════');

const matrixCases = [
  {
    id: 'B01',
    name: 'inputType=any включает все режимы',
    nodeId: 'input_any_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_any_1' }),
      makeInputNode('input_any_1', {
        inputType: 'any',
        inputVariable: 'user_any',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "text"', '"modes": [', '"photo"', '"video"', '"audio"', '"document"', '"location"', '"contact"'],
  },
  {
    id: 'B02',
    name: 'inputType=text оставляет только text',
    nodeId: 'input_text_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_text_1' }),
      makeInputNode('input_text_1', {
        inputType: 'text',
        inputVariable: 'user_text',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "text"', '"modes": ["text"]'],
  },
  {
    id: 'B03',
    name: 'inputType=photo включает photo mode',
    nodeId: 'input_photo_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_photo_1' }),
      makeInputNode('input_photo_1', {
        inputType: 'photo',
        inputVariable: 'user_photo',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "photo"', '"modes": ["photo"]'],
  },
  {
    id: 'B04',
    name: 'inputType=video включает video mode',
    nodeId: 'input_video_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_video_1' }),
      makeInputNode('input_video_1', {
        inputType: 'video',
        inputVariable: 'user_video',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "video"', '"modes": ["video"]'],
  },
  {
    id: 'B05',
    name: 'inputType=audio включает audio mode',
    nodeId: 'input_audio_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_audio_1' }),
      makeInputNode('input_audio_1', {
        inputType: 'audio',
        inputVariable: 'user_audio',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "audio"', '"modes": ["audio"]'],
  },
  {
    id: 'B06',
    name: 'inputType=document включает document mode',
    nodeId: 'input_document_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_document_1' }),
      makeInputNode('input_document_1', {
        inputType: 'document',
        inputVariable: 'user_document',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "document"', '"modes": ["document"]'],
  },
  {
    id: 'B07',
    name: 'inputType=location включает location mode',
    nodeId: 'input_location_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_location_1' }),
      makeInputNode('input_location_1', {
        inputType: 'location',
        inputVariable: 'user_location',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "location"', '"modes": ["location"]'],
  },
  {
    id: 'B08',
    name: 'inputType=contact включает contact mode',
    nodeId: 'input_contact_1',
    project: () => makeFlowProject([
      makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_contact_1' }),
      makeInputNode('input_contact_1', {
        inputType: 'contact',
        inputVariable: 'user_contact',
        inputTargetNodeId: 'msg_done',
      }),
      makeMessageNode('msg_done', 'Финал'),
    ]),
    parts: ['"type": "contact"', '"modes": ["contact"]'],
  },
];

for (const item of matrixCases) {
  test(item.id, item.name, () => {
    const code = gen(item.project(), item.id.toLowerCase());
    const b = block(code, item.nodeId);
    assertIncludesAll(b, item.parts, item.id);
    syntax(code, item.id.toLowerCase());
  });
}

console.log('══ Блок C: Специальные переменные и режимы записи ══════════════');

test('C01', 'photo_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_photo_1' }),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'user_photo',
      photoInputVariable: 'user_photo_file',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c01');
  assertIncludesAll(block(code, 'input_photo_1'), ['"photo_variable": "user_photo_file"'], 'C01');
});

test('C02', 'video_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_video_1' }),
    makeInputNode('input_video_1', {
      inputType: 'video',
      inputVariable: 'user_video',
      videoInputVariable: 'user_video_file',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c02');
  assertIncludesAll(block(code, 'input_video_1'), ['"video_variable": "user_video_file"'], 'C02');
});

test('C03', 'audio_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_audio_1' }),
    makeInputNode('input_audio_1', {
      inputType: 'audio',
      inputVariable: 'user_audio',
      audioInputVariable: 'user_audio_file',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c03');
  assertIncludesAll(block(code, 'input_audio_1'), ['"audio_variable": "user_audio_file"'], 'C03');
});

test('C04', 'document_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_document_1' }),
    makeInputNode('input_document_1', {
      inputType: 'document',
      inputVariable: 'user_document',
      documentInputVariable: 'user_document_file',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c04');
  assertIncludesAll(block(code, 'input_document_1'), ['"document_variable": "user_document_file"'], 'C04');
});

test('C05', 'location_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_location_1' }),
    makeInputNode('input_location_1', {
      inputType: 'location',
      inputVariable: 'user_location',
      locationInputVariable: 'user_location_point',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c05');
  assertIncludesAll(block(code, 'input_location_1'), ['"location_variable": "user_location_point"'], 'C05');
});

test('C06', 'contact_variable передаётся в waiting_for_input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_contact_1' }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'user_contact',
      contactInputVariable: 'user_contact_card',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c06');
  assertIncludesAll(block(code, 'input_contact_1'), ['"contact_variable": "user_contact_card"'], 'C06');
});

test('C07', 'inputType=any включает location и contact, а также остальные режимы', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_any_1' }),
    makeInputNode('input_any_1', {
      inputType: 'any',
      inputVariable: 'user_any',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c07');
  const b = block(code, 'input_any_1');
  assertIncludesAll(b, ['"modes": [', '"text"', '"photo"', '"video"', '"audio"', '"document"', '"location"', '"contact"'], 'C07');
});

test('C08', 'explicit variable overrides fallback variable for media modes', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_photo_1' }),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'photo_fallback',
      photoInputVariable: 'photo_explicit',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'c08');
  assertIncludesAll(block(code, 'input_photo_1'), ['"photo_variable": "photo_explicit"'], 'C08');
});

console.log('══ Блок D: Цепочки и переходы между input-узлами ═══════════════');

test('D01', 'message -> input -> input -> message вызывает оба dedicated handler-а', () => {
  const project = makeDedicatedInputChainProject();
  const code = gen(project, 'd01');
  assertIncludesAll(code, ['await handle_callback_input_text_1(fake_callback)', 'await handle_callback_input_text_2(fake_callback)'], 'D01');
  syntax(code, 'd01');
});

test('D02', 'message -> input -> message с autoTransition на dedicated input компилируется', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Ввод', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'answer_one',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Готово'),
  ]);

  const code = gen(project, 'd02');
  assertIncludesAll(block(code, 'msg_1'), ['await handle_callback_input_1(fake_callback)'], 'D02');
  assertIncludesAll(block(code, 'input_1'), ['"next_node_id": "msg_2"'], 'D02 input');
  syntax(code, 'd02');
});

test('D03', 'condition может вести прямо в dedicated input-узел', () => {
  const project = makeFlowProject([
    makeConditionNode('cond_1', 'flag', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'input_1' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_2' },
    ]),
    makeInputNode('input_1', {
      inputType: 'contact',
      inputVariable: 'contact_answer',
      contactInputVariable: 'contact_card',
      inputTargetNodeId: 'msg_3',
    }),
    makeMessageNode('msg_2', 'Иначе'),
    makeMessageNode('msg_3', 'Готово'),
  ]);

  const code = gen(project, 'd03');
  assertIncludesAll(code, ['async def handle_callback_cond_1', 'await handle_callback_input_1(callback_query)'], 'D03');
  syntax(code, 'd03');
});

test('D04', 'autoTransition из message в dedicated input не ломает next input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Первый шаг', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'first_value',
      inputTargetNodeId: 'input_2',
    }),
    makeInputNode('input_2', {
      inputType: 'text',
      inputVariable: 'second_value',
      inputTargetNodeId: 'msg_3',
    }),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'd04');
  assertIncludesAll(code, ['await handle_callback_input_1(fake_callback)', 'await handle_callback_input_2(fake_callback)'], 'D04');
  syntax(code, 'd04');
});

test('D05', 'message -> input -> message -> input -> message компилируется как длинная цепочка', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'input_1' }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'name',
      inputTargetNodeId: 'msg_2',
    }),
    makeMessageNode('msg_2', 'Шаг 2', { enableAutoTransition: true, autoTransitionTo: 'input_2' }),
    makeInputNode('input_2', {
      inputType: 'photo',
      inputVariable: 'photo',
      photoInputVariable: 'photo_file',
      inputTargetNodeId: 'msg_3',
    }),
    makeMessageNode('msg_3', 'Финал'),
  ]);

  const code = gen(project, 'd05');
  assertIncludesAll(code, ['await handle_callback_input_1(fake_callback)', 'await handle_callback_input_2(fake_callback)'], 'D05');
  syntax(code, 'd05');
});

test('D06', 'text ответ может вести в следующий non-message узел через fake callback', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Ввод', { enableAutoTransition: true, autoTransitionTo: 'input_1' }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'value',
      inputTargetNodeId: 'cond_1',
    }),
    makeConditionNode('cond_1', 'value', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'msg_2' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_3' },
    ]),
    makeMessageNode('msg_2', 'Да'),
    makeMessageNode('msg_3', 'Нет'),
  ]);

  const code = gen(project, 'd06');
  assertIncludesAll(code, ['await handle_callback_cond_1(fake_callback)'], 'D06');
  syntax(code, 'd06');
});

test('D07', 'full chain message -> input(any) -> input(contact) -> message', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Начало', { enableAutoTransition: true, autoTransitionTo: 'input_any_1' }),
    makeInputNode('input_any_1', {
      inputType: 'any',
      inputVariable: 'first_value',
      inputTargetNodeId: 'input_contact_1',
    }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'contact_value',
      contactInputVariable: 'contact_card',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Конец'),
  ]);

  const code = gen(project, 'd07');
  assertIncludesAll(code, ['await handle_callback_input_any_1(fake_callback)', 'await handle_callback_input_contact_1(fake_callback)'], 'D07');
  syntax(code, 'd07');
});

console.log('══ Блок E: Совместимость с legacy collectUserInput ═════════════');

test('E01', 'legacy message.collectUserInput всё ещё генерирует waiting_for_input', () => {
  const project = makeFlowProject([
    makeLegacyInputMessage('msg_legacy'),
    makeMessageNode('msg_done', 'Конец'),
  ]);

  const code = gen(project, 'e01');
  const legacy = block(code, 'msg_legacy');
  assertIncludesAll(legacy, ['waiting_for_input', '"variable": "legacy_answer"'], 'E01');
  syntax(code, 'e01');
});

test('E02', 'legacy message и dedicated input живут в одном проекте', () => {
  const project = makeLegacyCompatibilityProject();
  const code = gen(project, 'e02');
  assertIncludesAll(code, ['waiting_for_input', 'handle_callback_input_text_1', 'handle_callback_input_contact_1'], 'E02');
  syntax(code, 'e02');
});

test('E03', 'legacy reply flow со skipDataCollection не ломает dedicated input', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_legacy', 'Legacy', {
      keyboardType: 'reply',
      collectUserInput: true,
      inputVariable: 'legacy_reply',
      inputTargetNodeId: 'input_1',
      enableTextInput: true,
      buttons: [makeButton('Пропустить', 'goto', 'msg_done', { skipDataCollection: true })],
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'modern_reply',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Конец'),
  ]);

  const code = gen(project, 'e03');
  assertIncludesAll(code, ['skip_buttons', 'handle_callback_input_1'], 'E03');
  syntax(code, 'e03');
});

test('E04', 'legacy start/command + dedicated input компилируются вместе', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Открыть', 'goto', 'input_1')],
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Ввод', 'goto', 'input_1')],
    }),
    makeInputNode('input_1', {
      inputType: 'text',
      inputVariable: 'shared_answer',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'e04');
  assertIncludesAll(code, ['@dp.message(Command("start"))', '@dp.message(Command("help"))', 'handle_callback_input_1'], 'E04');
  syntax(code, 'e04');
});

test('E05', 'legacy message -> dedicated input -> legacy message chain работает', () => {
  const project = makeFlowProject([
    makeLegacyInputMessage('msg_legacy_1', {
      inputTargetNodeId: 'input_1',
    }),
    makeInputNode('input_1', {
      inputType: 'contact',
      inputVariable: 'modern_contact',
      contactInputVariable: 'modern_contact_card',
      inputTargetNodeId: 'msg_legacy_2',
    }),
    makeLegacyInputMessage('msg_legacy_2', {
      inputVariable: 'legacy_tail',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'e05');
  assertIncludesAll(code, ['handle_callback_input_1', 'waiting_for_input', 'legacy_tail'], 'E05');
  syntax(code, 'e05');
});

console.log('══ Блок F: Media handlers и DB-режим ═══════════════════════════');

test('F01', 'media input project генерирует photo/video/audio/document/location/contact handlers', () => {
  const project = makeMediaInputProject();
  const code = gen(project, 'f01');
  assertIncludesAll(code, [
    '@dp.message(F.photo)',
    '@dp.message(F.video)',
    '@dp.message(F.audio | F.voice)',
    '@dp.message(F.document)',
    '@dp.message(F.location)',
    '@dp.message(F.contact)',
  ], 'F01');
  syntax(code, 'f01');
});

test('F02', 'media input project сохраняет location_variable и contact_variable', () => {
  const project = makeMediaInputProject();
  const code = gen(project, 'f02');
  assertIncludesAll(code, [
    '"location_variable": "user_location_point"',
    '"contact_variable": "user_contact_card"',
  ], 'F02');
  syntax(code, 'f02');
});

test('F03', 'DB режим для media input project включает update_user_data_in_db', () => {
  const project = makeMediaInputProject();
  const code = gen(project, 'f03', true);
  assertIncludesAll(code, ['update_user_data_in_db', '"save_to_database": True'], 'F03');
  syntax(code, 'f03');
});

test('F04', 'media input project с any содержит все modes и callback handler', () => {
  const project = makeMediaInputProject();
  const code = gen(project, 'f04');
  assertIncludesAll(block(code, 'input_any_1'), ['"modes": [', '"contact"', '"location"'], 'F04');
  assertIncludesAll(code, ['async def handle_callback_input_any_1'], 'F04');
  syntax(code, 'f04');
});

test('F05', 'media input project не теряет синтаксис при цепочке нескольких dedicated input', () => {
  const project = makeMediaInputProject();
  syntax(gen(project, 'f05'), 'f05');
});

test('F06', 'media input project после photo input переходит в следующий input', () => {
  const project = makeMediaInputProject();
  const code = gen(project, 'f06');
  assertIncludesAll(code, ['await handle_callback_input_video_1(fake_callback)', 'await handle_callback_input_audio_1(fake_callback)'], 'F06');
  syntax(code, 'f06');
});

console.log('══ Блок G: Большой mixed project ═══════════════════════════════');

test('G01', 'mixed mega project совмещает start, command, condition, keyboard и input', () => {
  const project = makeMixedMegaProject();
  const code = gen(project, 'g01');
  assertIncludesAll(code, [
    '@dp.message(Command("start"))',
    '@dp.message(Command("help"))',
    'handle_callback_input_text_1',
    'handle_callback_input_photo_1',
    'handle_callback_input_contact_1',
    'ReplyKeyboardBuilder()',
    'InlineKeyboardBuilder()',
  ], 'G01');
  syntax(code, 'g01');
});

test('G02', 'mixed mega project даёт полную цепочку переходов через fake callback', () => {
  const project = makeMixedMegaProject();
  const code = gen(project, 'g02');
  assertIncludesAll(code, [
    'await handle_callback_input_text_1(fake_callback)',
    'await handle_callback_input_photo_1(fake_callback)',
    'await handle_callback_input_video_1(fake_callback)',
    'await handle_callback_input_audio_1(fake_callback)',
    'await handle_callback_input_document_1(fake_callback)',
    'await handle_callback_input_location_1(fake_callback)',
    'await handle_callback_input_contact_1(fake_callback)',
  ], 'G02');
  syntax(code, 'g02');
});

test('G03', 'mixed mega project сохраняет waiting_for_input для всех dedicated input nodes', () => {
  const project = makeMixedMegaProject();
  const code = gen(project, 'g03');
  assertIncludesAll(code, [
    '"variable": "field_text"',
    '"variable": "field_photo"',
    '"variable": "field_video"',
    '"variable": "field_audio"',
    '"variable": "field_document"',
    '"variable": "field_location"',
    '"variable": "field_contact"',
    '"variable": "field_any"',
  ], 'G03');
  syntax(code, 'g03');
});

test('G04', 'mixed mega project держит input handlers и reply keyboard в одном файле', () => {
  const project = makeMixedMegaProject();
  const code = gen(project, 'g04');
  assertIncludesAll(code, ['ReplyKeyboardBuilder()', 'KeyboardButton', 'handle_callback_input_any_1'], 'G04');
  syntax(code, 'g04');
});

test('G05', 'mixed mega project с DB режимом остаётся синтаксически валидным', () => {
  const project = makeMixedMegaProject();
  syntax(gen(project, 'g05', true), 'g05');
});

console.log('══ Блок H: Краевые случаи и синтаксис ══════════════════════════');

test('H01', 'dedicated input без target и без variable безопасно проходит через дефолты', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_1' }),
    makeInputNode('input_1', {
      inputType: 'text',
    }),
  ]);

  const code = gen(project, 'h01');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"variable": "input"', '"next_node_id": ""'], 'H01');
  syntax(code, 'h01');
});

test('H02', 'неизвестный inputType безопасно деградирует в text', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_1' }),
    makeInputNode('input_1', {
      inputType: 'unknown-type',
      inputVariable: 'fallback',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'h02');
  const inp = block(code, 'input_1');
  assertIncludesAll(inp, ['"type": "text"', '"modes": ["text"]'], 'H02');
  syntax(code, 'h02');
});

test('H03', 'dedicated input не мешает пустому keyboard узлу в том же проекте', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Старт', { enableAutoTransition: true, autoTransitionTo: 'input_1' }),
    makeInputNode('input_1', {
      inputType: 'contact',
      inputVariable: 'answer',
      inputTargetNodeId: 'msg_2',
    }),
    makeKeyboardNode('kbd_1', 'inline', []),
    makeMessageNode('msg_2', 'Финал'),
  ]);

  const code = gen(project, 'h03');
  assertIncludesAll(code, ['handle_callback_input_1', 'без самостоятельной отправки сообщения'], 'H03');
  syntax(code, 'h03');
});

test('H04', 'input цепочка в большом проекте компилируется вместе с start/command', () => {
  const project = makeMixedMegaProject();
  syntax(gen(project, 'h04'), 'h04');
});

test('H05', 'DB проект с input contact и input location компилируется', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Контакт', 'goto', 'input_contact_1')],
    }),
    makeInputNode('input_contact_1', {
      inputType: 'contact',
      inputVariable: 'contact_user',
      contactInputVariable: 'contact_card',
      inputTargetNodeId: 'input_location_1',
    }),
    makeInputNode('input_location_1', {
      inputType: 'location',
      inputVariable: 'location_user',
      locationInputVariable: 'location_point',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  syntax(gen(project, 'h05', true), 'h05');
});

test('H06', 'гигантский dedicated input проект компилируется и не теряет handlers', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_1', 'Шаг 1', { enableAutoTransition: true, autoTransitionTo: 'input_text_1' }),
    makeInputNode('input_text_1', { inputType: 'text', inputVariable: 'v1', inputTargetNodeId: 'input_photo_1' }),
    makeInputNode('input_photo_1', { inputType: 'photo', inputVariable: 'v2', photoInputVariable: 'p2', inputTargetNodeId: 'input_video_1' }),
    makeInputNode('input_video_1', { inputType: 'video', inputVariable: 'v3', videoInputVariable: 'v3_file', inputTargetNodeId: 'input_audio_1' }),
    makeInputNode('input_audio_1', { inputType: 'audio', inputVariable: 'v4', audioInputVariable: 'v4_file', inputTargetNodeId: 'input_document_1' }),
    makeInputNode('input_document_1', { inputType: 'document', inputVariable: 'v5', documentInputVariable: 'v5_file', inputTargetNodeId: 'input_location_1' }),
    makeInputNode('input_location_1', { inputType: 'location', inputVariable: 'v6', locationInputVariable: 'v6_point', inputTargetNodeId: 'input_contact_1' }),
    makeInputNode('input_contact_1', { inputType: 'contact', inputVariable: 'v7', contactInputVariable: 'v7_card', inputTargetNodeId: 'input_any_1' }),
    makeInputNode('input_any_1', { inputType: 'any', inputVariable: 'v8', inputTargetNodeId: 'msg_done' }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'h06', true);
  assertIncludesAll(code, [
    'handle_callback_input_text_1',
    'handle_callback_input_photo_1',
    'handle_callback_input_video_1',
    'handle_callback_input_audio_1',
    'handle_callback_input_document_1',
    'handle_callback_input_location_1',
    'handle_callback_input_contact_1',
    'handle_callback_input_any_1',
  ], 'H06');
  syntax(code, 'h06');
});

console.log('══ Блок I: Shared input / reuse одного input-узла ══════════════');

test('I01', 'message_1 и message_2 используют один shared input-узел без дублей handler-а', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i01');
  assertIncludesAll(code, [
    'await handle_callback_shared_input_1(fake_callback)',
    'await handle_callback_shared_input_1(callback_query)',
  ], 'I01');
  ok(countOccurrences(code, 'async def handle_callback_shared_input_1') === 1, 'I01: handler должен быть один');
  ok(countOccurrences(code, '@dp.callback_query(lambda c: c.data == "shared_input_1")') === 1, 'I01: decorator должен быть один');
  assertIncludesAll(block(code, 'shared_input_1'), ['"waiting_for_input"', '"variable": "shared_answer"', '"next_node_id": "msg_done"'], 'I01 shared');
  syntax(code, 'i01');
});

test('I02', 'start и command могут вести в один shared input-узел', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i02');
  assertIncludesAll(code, [
    '@dp.message(Command("start"))',
    '@dp.message(Command("help"))',
    'await handle_callback_shared_input_1(fake_callback)',
  ], 'I02');
  ok(countOccurrences(code, 'async def handle_callback_shared_input_1') === 1, 'I02: shared handler должен быть один');
  syntax(code, 'i02');
});

test('I03', 'condition и keyboard button могут вести в один shared input-узел', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i03');
  assertIncludesAll(code, [
    'async def handle_callback_cond_1',
    'await handle_callback_shared_input_1(callback_query)',
    'callback_data="shared_input_1"',
  ], 'I03');
  syntax(code, 'i03');
});

test('I04', 'несколько autoTransition веток сходятся в один shared input', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i04');
  assertIncludesAll(code, [
    'await handle_callback_shared_input_1(fake_callback)',
  ], 'I04');
  ok(countOccurrences(code, 'await handle_callback_shared_input_1(fake_callback)') >= 3, 'I04: ожидается несколько autoTransition вызовов');
  syntax(code, 'i04');
});

test('I05', 'shared input и legacy collectUserInput совместно используют один next hop', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i05');
  assertIncludesAll(code, [
    'legacy_source_answer',
    'shared_answer',
    'skip_buttons',
  ], 'I05');
  assertIncludesAll(block(code, 'msg_legacy'), ['"next_node_id": "shared_input_1"'], 'I05 legacy');
  assertIncludesAll(block(code, 'shared_input_1'), ['"next_node_id": "msg_done"'], 'I05 shared');
  syntax(code, 'i05');
});

test('I06', 'shared input может быть any и обслуживать все типы ответов', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i06');
  const shared = block(code, 'shared_input_1');
  assertIncludesAll(shared, ['"type": "text"', '"modes": [', '"photo"', '"video"', '"audio"', '"document"', '"location"', '"contact"'], 'I06');
  syntax(code, 'i06');
});

test('I07', 'shared input reuse сохраняет совместимость с media и keyboard-соседями', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i07');
  assertIncludesAll(code, [
    'InlineKeyboardBuilder()',
    'ReplyKeyboardBuilder()',
    'callback_data="shared_input_1"',
    'await handle_callback_shared_input_1(callback_query)',
  ], 'I07');
  syntax(code, 'i07');
});

test('I08', 'shared input reuse в большом mixed project компилируется', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      keyboardType: 'reply',
      buttons: [makeButton('Shared', 'goto', 'shared_input_1')],
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Shared', 'goto', 'shared_input_1')],
      enableAutoTransition: true,
      autoTransitionTo: 'shared_input_1',
    }),
    makeMessageNode('msg_1', 'Источник 1', { enableAutoTransition: true, autoTransitionTo: 'shared_input_1' }),
    makeMessageNode('msg_2', 'Источник 2', { enableAutoTransition: true, autoTransitionTo: 'shared_input_1' }),
    makeConditionNode('cond_1', 'flag', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'shared_input_1' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_done' },
    ]),
    makeKeyboardNode('kbd_1', 'inline', [makeButton('Shared', 'goto', 'shared_input_1')]),
    makeInputNode('shared_input_1', {
      inputType: 'contact',
      inputVariable: 'shared_contact',
      contactInputVariable: 'shared_contact_card',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'i08', true);
  ok(countOccurrences(code, 'async def handle_callback_shared_input_1') === 1, 'I08: shared handler должен быть один');
  syntax(code, 'i08');
});

test('I09', 'shared input reuse не ломает синтаксис при нескольких источниках в одном файле', () => {
  const project = makeSharedInputReuseProject();
  syntax(gen(project, 'i09'), 'i09');
});

test('I10', 'shared input reuse после ответа всегда ведёт в inputTargetNodeId', () => {
  const project = makeSharedInputReuseProject();
  const code = gen(project, 'i10');
  assertIncludesAll(block(code, 'shared_input_1'), ['"next_node_id": "msg_done"'], 'I10');
  syntax(code, 'i10');
});

test('I11', 'shared photo input может быть переиспользован несколькими источниками', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_photo_1',
      keyboardType: 'reply',
      buttons: [makeButton('Фото', 'goto', 'shared_photo_1')],
    }),
    makeCommandNode('cmd_help', '/help', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_photo_1',
      keyboardType: 'inline',
      buttons: [makeButton('Фото', 'goto', 'shared_photo_1')],
    }),
    makeMessageNode('msg_1', 'Источник 1', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_photo_1',
    }),
    makeMessageNode('msg_2', 'Источник 2', {
      enableAutoTransition: true,
      autoTransitionTo: 'shared_photo_1',
    }),
    makeConditionNode('cond_1', 'photo_flag', [
      { id: 'br_1', label: 'filled', operator: 'filled', value: '', target: 'shared_photo_1' },
      { id: 'br_2', label: 'else', operator: 'else', value: '', target: 'msg_done' },
    ]),
    makeInputNode('shared_photo_1', {
      inputType: 'photo',
      inputVariable: 'shared_photo',
      photoInputVariable: 'shared_photo_file',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'i11');
  assertIncludesAll(code, [
    '@dp.message(F.photo)',
    '"photo_variable": "shared_photo_file"',
    'await handle_callback_shared_photo_1(fake_callback)',
  ], 'I11');
  ok(countOccurrences(code, 'async def handle_callback_shared_photo_1') === 1, 'I11: photo handler должен быть один');
  syntax(code, 'i11');
});

console.log('══ Блок J: Реалистичный сценарий по мотивам project.json ═════════');

test('J01', 'private/group condition + legacy text collectUserInput + dedicated text input повторяют реальный паттерн', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      enableAutoTransition: true,
      autoTransitionTo: 'cond_scope_1',
      keyboardType: 'reply',
      buttons: [
        makeButton('Ввод', 'goto', 'msg_private_age'),
        makeButton('Группа', 'goto', 'msg_group_notice'),
      ],
    }),
    makeConditionNode('cond_scope_1', '', [
      { id: 'br_private', label: 'private', operator: 'is_private', value: '', target: 'msg_private_age' },
      { id: 'br_group', label: 'group', operator: 'is_group', value: '', target: 'msg_group_notice' },
    ]),
    makeMessageNode('msg_private_age', 'Привет снова. Сколько тебе лет?', {
      keyboardType: 'reply',
      keyboardNodeId: 'kbd_private_age',
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'age',
      inputTargetNodeId: 'input_age_1',
      enableAutoTransition: true,
      autoTransitionTo: 'input_age_1',
      buttons: [makeButton('Пропустить', 'goto', 'msg_done', { skipDataCollection: true })],
    }),
    makeKeyboardNode('kbd_private_age', 'reply', [
      makeButton('16', 'goto', 'input_age_1'),
      makeButton('18', 'goto', 'input_age_1'),
    ], {
      oneTimeKeyboard: false,
      resizeKeyboard: true,
    }),
    makeInputNode('input_age_1', {
      inputType: 'text',
      inputVariable: 'age',
      inputPrompt: 'Введите ответ',
      inputRequired: true,
      inputTargetNodeId: '',
    }),
    makeMessageNode('msg_group_notice', 'Привет это команда не для группы', {
      enableAutoTransition: true,
      autoTransitionTo: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'j01');
  const legacy = block(code, 'msg_private_age');
  const input = block(code, 'input_age_1');
  assertIncludesAll(legacy, [
    'ReplyKeyboardBuilder()',
    'KeyboardButton',
    'waiting_for_input',
    '"variable": "age"',
    '"next_node_id": "input_age_1"',
  ], 'J01 legacy');
  assertIncludesAll(input, [
    '@dp.callback_query(lambda c: c.data == "input_age_1")',
    '"waiting_for_input"',
    '"variable": "age"',
    '"type": "text"',
    '"next_node_id": ""',
  ], 'J01 input');
  assertIncludesAll(code, ['async def handle_callback_cond_scope_1', 'await handle_callback_input_age_1(fake_callback)'], 'J01 flow');
  syntax(code, 'j01');
});

test('J01b', 'dedicated input не должен дублироваться generic auto-transition callback-обработчиком', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_age', 'Сколько тебе лет?', {
      enableAutoTransition: true,
      autoTransitionTo: 'input_age',
    }),
    makeInputNode('input_age', {
      inputType: 'text',
      inputVariable: 'age',
      inputTargetNodeId: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Готово'),
  ]);

  const code = gen(project, 'j01b');
  ok(countOccurrences(code, '@dp.callback_query(lambda c: c.data == "input_age")') === 1, 'J01b: dedicated input должен иметь один callback handler');
  ok(countOccurrences(code, 'async def handle_callback_input_age') === 1, 'J01b: dedicated input handler не должен дублироваться');
  ok(!code.includes('handle_callback_t_age'), 'J01b: generic short-id callback для input не должен генерироваться');
  assertIncludesAll(block(code, 'input_age'), ['Активация input-узла input_age', '"waiting_for_input"'], 'J01b');
  syntax(code, 'j01b');
});

test('J02', 'legacy photo collectUserInput ведёт в dedicated photo input и media node', () => {
  const project = makeFlowProject([
    makeMessageNode('msg_photo_prompt', 'Сообщение 1', {
      keyboardType: 'reply',
      keyboardNodeId: 'kbd_photo_prompt',
      collectUserInput: true,
      enablePhotoInput: true,
      inputVariable: 'photo',
      photoInputVariable: 'photo',
      inputTargetNodeId: 'media_photo_1',
      enableAutoTransition: true,
      autoTransitionTo: 'input_photo_1',
      buttons: [makeButton('Фото', 'goto', 'input_photo_1')],
    }),
    makeKeyboardNode('kbd_photo_prompt', 'reply', [
      makeButton('Фото', 'goto', 'input_photo_1'),
    ]),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'photo',
      photoInputVariable: 'photo_file',
      inputTargetNodeId: 'media_photo_1',
    }),
    makeMediaNode('media_photo_1', ['{photo}']),
  ]);

  const code = gen(project, 'j02');
  const legacy = block(code, 'msg_photo_prompt');
  const input = block(code, 'input_photo_1');
  const media = block(code, 'media_photo_1');
  assertIncludesAll(legacy, [
    'ReplyKeyboardBuilder()',
    'KeyboardButton',
    'waiting_for_input',
    '"variable": "photo"',
    '"next_node_id": "media_photo_1"',
    '"photo_variable": "photo"',
  ], 'J02 legacy');
  assertIncludesAll(input, [
    '"type": "photo"',
    '"photo_variable": "photo_file"',
    '"next_node_id": "media_photo_1"',
  ], 'J02 input');
  assertIncludesAll(media, [
    '@dp.callback_query(lambda c: c.data == "media_photo_1")',
    'answer_photo',
    'handle_callback_media_photo_1',
  ], 'J02 media');
  syntax(code, 'j02');
});

test('J03', 'большой mixed project по мотивам реального графа компилируется и сохраняет паттерны', () => {
  const project = makeFlowProject([
    makeStartNode('start_1', {
      enableAutoTransition: true,
      autoTransitionTo: 'cond_scope_1',
      keyboardType: 'reply',
      buttons: [
        makeButton('Да', 'goto', 'msg_private_age'),
        makeButton('Нет', 'goto', 'msg_group_notice'),
      ],
    }),
    makeCommandNode('cmd_help', '/help', {
      keyboardType: 'inline',
      buttons: [makeButton('Возраст', 'goto', 'msg_private_age')],
      enableAutoTransition: true,
      autoTransitionTo: 'cond_scope_1',
    }),
    makeConditionNode('cond_scope_1', '', [
      { id: 'br_private', label: 'private', operator: 'is_private', value: '', target: 'msg_private_age' },
      { id: 'br_group', label: 'group', operator: 'is_group', value: '', target: 'msg_group_notice' },
    ]),
    makeMessageNode('msg_private_age', 'Привет снова. Сколько тебе лет?', {
      keyboardType: 'reply',
      keyboardNodeId: 'kbd_private_age',
      collectUserInput: true,
      enableTextInput: true,
      inputVariable: 'age',
      inputTargetNodeId: 'input_age_1',
      enableAutoTransition: true,
      autoTransitionTo: 'input_age_1',
      buttons: [makeButton('Пропустить', 'goto', 'msg_done', { skipDataCollection: true })],
    }),
    makeKeyboardNode('kbd_private_age', 'reply', [
      makeButton('16', 'goto', 'input_age_1'),
      makeButton('18', 'goto', 'input_age_1'),
    ]),
    makeInputNode('input_age_1', {
      inputType: 'text',
      inputVariable: 'age',
      inputTargetNodeId: '',
    }),
    makeMessageNode('msg_photo_prompt', 'Сообщение 1', {
      keyboardType: 'reply',
      keyboardNodeId: 'kbd_photo_prompt',
      collectUserInput: true,
      enablePhotoInput: true,
      inputVariable: 'photo',
      photoInputVariable: 'photo',
      inputTargetNodeId: 'media_photo_1',
      enableAutoTransition: true,
      autoTransitionTo: 'input_photo_1',
      buttons: [makeButton('Фото', 'goto', 'input_photo_1')],
    }),
    makeKeyboardNode('kbd_photo_prompt', 'reply', [
      makeButton('Фото', 'goto', 'input_photo_1'),
    ]),
    makeInputNode('input_photo_1', {
      inputType: 'photo',
      inputVariable: 'photo',
      photoInputVariable: 'photo_file',
      inputTargetNodeId: 'media_photo_1',
    }),
    makeMediaNode('media_photo_1', ['{photo}']),
    makeMessageNode('msg_group_notice', 'Привет это команда не для группы', {
      enableAutoTransition: true,
      autoTransitionTo: 'msg_done',
    }),
    makeMessageNode('msg_done', 'Финал'),
  ]);

  const code = gen(project, 'j03');
  assertIncludesAll(code, [
    'async def handle_callback_cond_scope_1',
    'ReplyKeyboardBuilder()',
    'InlineKeyboardBuilder()',
    'handle_callback_input_age_1',
    'handle_callback_input_photo_1',
    'handle_callback_media_photo_1',
    'waiting_for_input',
  ], 'J03');
  ok(countOccurrences(code, 'async def handle_callback_input_age_1') === 1, 'J03: input_age handler должен быть один');
  ok(countOccurrences(code, 'async def handle_callback_input_photo_1') === 1, 'J03: input_photo handler должен быть один');
  ok(countOccurrences(code, 'async def handle_callback_media_photo_1') === 1, 'J03: media handler должен быть один');
  syntax(code, 'j03');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\nИтог: ${passed}/${total} пройдено${failed > 0 ? `, ${failed} провалено` : ' ✅'}`);

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
